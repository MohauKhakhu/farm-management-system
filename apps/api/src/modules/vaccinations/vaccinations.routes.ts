import { Router } from 'express';
import prisma from '@farm/db';
import { requireAuth, requireRoles } from '../auth/middleware';

export const router = Router();

router.get('/schedule', requireAuth, async (_req, res) => {
  const schedules = await prisma.vaccinationSchedule.findMany({ include: { species: true, vaccine: true } });
  res.json(schedules);
});

router.post('/schedule', requireAuth, requireRoles(['admin', 'vet', 'manager']), async (req, res) => {
  const { speciesId, vaccineId, ageDays, repeatDays } = req.body as { speciesId: string; vaccineId: string; ageDays: number; repeatDays?: number };
  const created = await prisma.vaccinationSchedule.create({ data: { speciesId, vaccineId, ageDays, repeatDays } });
  res.status(201).json(created);
});

router.get('/records/:animalId', requireAuth, async (req, res) => {
  const records = await prisma.vaccinationRecord.findMany({ where: { animalId: req.params.animalId }, include: { vaccine: true } });
  res.json(records);
});

router.post('/records/:animalId', requireAuth, requireRoles(['vet', 'manager', 'admin']), async (req, res) => {
  const { vaccineId, scheduledDate, administeredAt, dose, administeredBy, notes } = req.body as any;
  const created = await prisma.vaccinationRecord.create({ data: { animalId: req.params.animalId, vaccineId, scheduledDate: new Date(scheduledDate), administeredAt: administeredAt ? new Date(administeredAt) : null, dose, administeredBy, notes } });
  res.status(201).json(created);
});
