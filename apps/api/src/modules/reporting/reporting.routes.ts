import { Router } from 'express';
import prisma from '@farm/db';
import { requireAuth } from '../auth/middleware';

export const router = Router();

router.get('/kpis', requireAuth, async (_req, res) => {
  const [animals, openDisease, pendingVaccines] = await Promise.all([
    prisma.animal.count(),
    prisma.diseaseEvent.count({ where: { status: 'OPEN' } }),
    prisma.vaccinationRecord.count({ where: { administeredAt: null } })
  ]);
  res.json({ animals, openDisease, pendingVaccines });
});
