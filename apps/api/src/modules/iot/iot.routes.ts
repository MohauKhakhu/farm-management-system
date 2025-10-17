import { Router } from 'express';
import prisma from '@farm/db';
import { requireAuth } from '../auth/middleware';

export const router = Router();

// HTTP ingestion endpoint for sensor readings
router.post('/readings', requireAuth, async (req, res) => {
  const { deviceId, metric, value, unit, relatedAnimalId, recordedAt } = req.body as any;
  const created = await prisma.sensorReading.create({ data: { deviceId, metric, value: Number(value), unit, relatedAnimalId: relatedAnimalId || null, recordedAt: recordedAt ? new Date(recordedAt) : undefined } });
  res.status(201).json(created);
});
