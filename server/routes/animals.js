const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { checkFarmAccess } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const animalSchema = Joi.object({
  tagId: Joi.string().required(),
  name: Joi.string().optional(),
  farmId: Joi.string().uuid().required(),
  breedId: Joi.string().uuid().optional(),
  gender: Joi.string().valid('male', 'female').required(),
  birthDate: Joi.date().optional(),
  birthWeight: Joi.number().positive().optional(),
  currentWeight: Joi.number().positive().optional(),
  color: Joi.string().optional(),
  markings: Joi.string().optional(),
  status: Joi.string().valid('active', 'sold', 'deceased', 'transferred').default('active'),
  motherId: Joi.string().uuid().optional(),
  fatherId: Joi.string().uuid().optional(),
  geneticTraits: Joi.object().optional(),
  acquisitionMethod: Joi.string().optional(),
  acquisitionDate: Joi.date().optional(),
  acquisitionCost: Joi.number().optional(),
  sourceFarm: Joi.string().optional()
});

const healthRecordSchema = Joi.object({
  animalId: Joi.string().uuid().required(),
  recordDate: Joi.date().required(),
  recordType: Joi.string().valid('vaccination', 'treatment', 'checkup', 'illness', 'injury', 'other').required(),
  conditionDiagnosis: Joi.string().optional(),
  symptoms: Joi.string().optional(),
  treatmentGiven: Joi.string().optional(),
  medication: Joi.string().optional(),
  dosage: Joi.string().optional(),
  veterinarian: Joi.string().optional(),
  cost: Joi.number().optional(),
  nextCheckupDate: Joi.date().optional(),
  notes: Joi.string().optional()
});

const weightRecordSchema = Joi.object({
  animalId: Joi.string().uuid().required(),
  weighDate: Joi.date().required(),
  weight: Joi.number().positive().required(),
  weightUnit: Joi.string().default('kg'),
  notes: Joi.string().optional()
});

// Get all animals for a farm
router.get('/farm/:farmId', checkFarmAccess, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status, breed, gender } = req.query;
    const offset = (page - 1) * limit;

    let query = db('animals')
      .leftJoin('animal_breeds', 'animals.breed_id', 'animal_breeds.id')
      .select(
        'animals.*',
        'animal_breeds.name as breed_name',
        'animal_breeds.species'
      )
      .where('animals.farm_id', req.farmId);

    // Apply filters
    if (search) {
      query = query.where(function() {
        this.where('animals.tag_id', 'ilike', `%${search}%`)
            .orWhere('animals.name', 'ilike', `%${search}%`);
      });
    }

    if (status) {
      query = query.where('animals.status', status);
    }

    if (breed) {
      query = query.where('animals.breed_id', breed);
    }

    if (gender) {
      query = query.where('animals.gender', gender);
    }

    // Get total count
    const totalQuery = query.clone();
    const [{ count }] = await totalQuery.count('animals.id as count');

    // Get paginated results
    const animals = await query
      .orderBy('animals.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json({
      animals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching animals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single animal by ID
router.get('/:id', async (req, res) => {
  try {
    const animal = await db('animals')
      .leftJoin('animal_breeds', 'animals.breed_id', 'animal_breeds.id')
      .leftJoin('animals as mother', 'animals.mother_id', 'mother.id')
      .leftJoin('animals as father', 'animals.father_id', 'father.id')
      .select(
        'animals.*',
        'animal_breeds.name as breed_name',
        'animal_breeds.species',
        'mother.tag_id as mother_tag',
        'mother.name as mother_name',
        'father.tag_id as father_tag',
        'father.name as father_name'
      )
      .where('animals.id', req.params.id)
      .first();

    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    // Get latest weight
    const latestWeight = await db('animal_weights')
      .where('animal_id', animal.id)
      .orderBy('weigh_date', 'desc')
      .first();

    // Get health summary
    const healthSummary = await db('animal_health_records')
      .where('animal_id', animal.id)
      .select('record_type')
      .count('* as count')
      .groupBy('record_type');

    // Get offspring count
    const [{ count: offspringCount }] = await db('animals')
      .where(function() {
        this.where('mother_id', animal.id).orWhere('father_id', animal.id);
      })
      .count('* as count');

    res.json({
      ...animal,
      latestWeight,
      healthSummary,
      offspringCount: parseInt(offspringCount)
    });
  } catch (error) {
    logger.error('Error fetching animal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new animal
router.post('/', checkFarmAccess, async (req, res) => {
  try {
    const { error, value } = animalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if tag ID already exists in the farm
    const existingAnimal = await db('animals')
      .where({ tag_id: value.tagId, farm_id: value.farmId })
      .first();

    if (existingAnimal) {
      return res.status(400).json({ error: 'Animal with this tag ID already exists in the farm' });
    }

    // Validate parent animals exist and belong to same farm
    if (value.motherId) {
      const mother = await db('animals')
        .where({ id: value.motherId, farm_id: value.farmId, gender: 'female' })
        .first();
      if (!mother) {
        return res.status(400).json({ error: 'Invalid mother ID' });
      }
    }

    if (value.fatherId) {
      const father = await db('animals')
        .where({ id: value.fatherId, farm_id: value.farmId, gender: 'male' })
        .first();
      if (!father) {
        return res.status(400).json({ error: 'Invalid father ID' });
      }
    }

    const animalId = uuidv4();
    const animalData = {
      id: animalId,
      tag_id: value.tagId,
      name: value.name,
      farm_id: value.farmId,
      breed_id: value.breedId,
      gender: value.gender,
      birth_date: value.birthDate,
      birth_weight: value.birthWeight,
      current_weight: value.currentWeight,
      color: value.color,
      markings: value.markings,
      status: value.status,
      mother_id: value.motherId,
      father_id: value.fatherId,
      genetic_traits: value.geneticTraits ? JSON.stringify(value.geneticTraits) : null,
      acquisition_method: value.acquisitionMethod,
      acquisition_date: value.acquisitionDate,
      acquisition_cost: value.acquisitionCost,
      source_farm: value.sourceFarm
    };

    const [animal] = await db('animals')
      .insert(animalData)
      .returning('*');

    // Create initial weight record if provided
    if (value.currentWeight) {
      await db('animal_weights').insert({
        id: uuidv4(),
        animal_id: animalId,
        weigh_date: new Date(),
        weight: value.currentWeight,
        weight_unit: 'kg',
        recorded_by: req.user.id
      });
    }

    logger.info(`New animal created: ${value.tagId} by user ${req.user.id}`);

    res.status(201).json(animal);
  } catch (error) {
    logger.error('Error creating animal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update animal
router.put('/:id', async (req, res) => {
  try {
    const { error, value } = animalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const animal = await db('animals')
      .where('id', req.params.id)
      .first();

    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    // Check if tag ID already exists (excluding current animal)
    if (value.tagId !== animal.tag_id) {
      const existingAnimal = await db('animals')
        .where({ tag_id: value.tagId, farm_id: animal.farm_id })
        .whereNot('id', req.params.id)
        .first();

      if (existingAnimal) {
        return res.status(400).json({ error: 'Animal with this tag ID already exists in the farm' });
      }
    }

    const updateData = {
      tag_id: value.tagId,
      name: value.name,
      breed_id: value.breedId,
      gender: value.gender,
      birth_date: value.birthDate,
      birth_weight: value.birthWeight,
      current_weight: value.currentWeight,
      color: value.color,
      markings: value.markings,
      status: value.status,
      mother_id: value.motherId,
      father_id: value.fatherId,
      genetic_traits: value.geneticTraits ? JSON.stringify(value.geneticTraits) : null,
      acquisition_method: value.acquisitionMethod,
      acquisition_date: value.acquisitionDate,
      acquisition_cost: value.acquisitionCost,
      source_farm: value.sourceFarm,
      updated_at: new Date()
    };

    const [updatedAnimal] = await db('animals')
      .where('id', req.params.id)
      .update(updateData)
      .returning('*');

    logger.info(`Animal updated: ${value.tagId} by user ${req.user.id}`);

    res.json(updatedAnimal);
  } catch (error) {
    logger.error('Error updating animal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete animal
router.delete('/:id', async (req, res) => {
  try {
    const animal = await db('animals')
      .where('id', req.params.id)
      .first();

    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    // Check if animal has offspring
    const [{ count: offspringCount }] = await db('animals')
      .where(function() {
        this.where('mother_id', req.params.id).orWhere('father_id', req.params.id);
      })
      .count('* as count');

    if (offspringCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete animal with offspring. Update status to inactive instead.' 
      });
    }

    await db('animals')
      .where('id', req.params.id)
      .del();

    logger.info(`Animal deleted: ${animal.tag_id} by user ${req.user.id}`);

    res.json({ message: 'Animal deleted successfully' });
  } catch (error) {
    logger.error('Error deleting animal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get animal health records
router.get('/:id/health', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const healthRecords = await db('animal_health_records')
      .leftJoin('users', 'animal_health_records.recorded_by', 'users.id')
      .select(
        'animal_health_records.*',
        'users.first_name',
        'users.last_name'
      )
      .where('animal_health_records.animal_id', req.params.id)
      .orderBy('record_date', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db('animal_health_records')
      .where('animal_id', req.params.id)
      .count('* as count');

    res.json({
      healthRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching health records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add health record
router.post('/:id/health', async (req, res) => {
  try {
    const { error, value } = healthRecordSchema.validate({
      ...req.body,
      animalId: req.params.id
    });
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const healthRecord = {
      id: uuidv4(),
      animal_id: value.animalId,
      record_date: value.recordDate,
      record_type: value.recordType,
      condition_diagnosis: value.conditionDiagnosis,
      symptoms: value.symptoms,
      treatment_given: value.treatmentGiven,
      medication: value.medication,
      dosage: value.dosage,
      veterinarian: value.veterinarian,
      cost: value.cost,
      next_checkup_date: value.nextCheckupDate,
      notes: value.notes,
      recorded_by: req.user.id
    };

    const [record] = await db('animal_health_records')
      .insert(healthRecord)
      .returning('*');

    logger.info(`Health record added for animal ${req.params.id} by user ${req.user.id}`);

    res.status(201).json(record);
  } catch (error) {
    logger.error('Error adding health record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get animal weight history
router.get('/:id/weights', async (req, res) => {
  try {
    const weights = await db('animal_weights')
      .leftJoin('users', 'animal_weights.recorded_by', 'users.id')
      .select(
        'animal_weights.*',
        'users.first_name',
        'users.last_name'
      )
      .where('animal_weights.animal_id', req.params.id)
      .orderBy('weigh_date', 'desc');

    res.json(weights);
  } catch (error) {
    logger.error('Error fetching weight records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add weight record
router.post('/:id/weights', async (req, res) => {
  try {
    const { error, value } = weightRecordSchema.validate({
      ...req.body,
      animalId: req.params.id
    });
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const weightRecord = {
      id: uuidv4(),
      animal_id: value.animalId,
      weigh_date: value.weighDate,
      weight: value.weight,
      weight_unit: value.weightUnit,
      notes: value.notes,
      recorded_by: req.user.id
    };

    const [record] = await db('animal_weights')
      .insert(weightRecord)
      .returning('*');

    // Update current weight in animals table
    await db('animals')
      .where('id', req.params.id)
      .update({ current_weight: value.weight });

    logger.info(`Weight record added for animal ${req.params.id} by user ${req.user.id}`);

    res.status(201).json(record);
  } catch (error) {
    logger.error('Error adding weight record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get animal movement history
router.get('/:id/movements', async (req, res) => {
  try {
    const movements = await db('animal_movements')
      .leftJoin('users', 'animal_movements.authorized_by', 'users.id')
      .select(
        'animal_movements.*',
        'users.first_name',
        'users.last_name'
      )
      .where('animal_movements.animal_id', req.params.id)
      .orderBy('movement_date', 'desc');

    res.json(movements);
  } catch (error) {
    logger.error('Error fetching movement records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get animal breeds
router.get('/breeds/list', async (req, res) => {
  try {
    const breeds = await db('animal_breeds')
      .select('*')
      .orderBy('species')
      .orderBy('name');

    res.json(breeds);
  } catch (error) {
    logger.error('Error fetching breeds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;