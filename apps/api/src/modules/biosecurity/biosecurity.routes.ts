import { Router } from 'express';
import prisma from '@farm/db';
import { requireAuth, requireRoles } from '../auth/middleware';

export const router = Router();

router.post('/visitors', requireAuth, async (req, res) => {
  const { name, purpose, badgeId } = req.body as any;
  const log = await prisma.visitorLog.create({ data: { name, purpose, badgeId } });
  res.status(201).json(log);
});

router.post('/visitors/:id/checkout', requireAuth, async (req, res) => {
  const log = await prisma.visitorLog.update({ where: { id: req.params.id }, data: { departedAt: new Date() } });
  res.json(log);
});

router.post('/waste', requireAuth, requireRoles(['admin', 'manager']), async (req, res) => {
  const { type, quantity, method, location } = req.body as any;
  const w = await prisma.wasteLog.create({ data: { type, quantity: Number(quantity), method, location } });
  res.status(201).json(w);
});

router.post('/sanitation', requireAuth, async (req, res) => {
  const { location, action, notes } = req.body as any;
  const s = await prisma.sanitationAction.create({ data: { location, action, notes } });
  res.status(201).json(s);
});

router.post('/disease', requireAuth, requireRoles(['admin', 'vet', 'manager']), async (req, res) => {
  const { name, notes } = req.body as any;
  const d = await prisma.diseaseEvent.create({ data: { name, notes } });
  res.status(201).json(d);
});

router.post('/disease/:id/close', requireAuth, requireRoles(['admin', 'vet', 'manager']), async (req, res) => {
  const d = await prisma.diseaseEvent.update({ where: { id: req.params.id }, data: { status: 'CLOSED', endedAt: new Date() } });
  res.json(d);
});
