import { Router } from 'express';
import { z } from 'zod';
import prisma from '@farm/db';
import { requireAuth, requireRoles } from '../auth/middleware';

export const router = Router();

const animalSchema = z.object({
  tag: z.string().min(1),
  name: z.string().optional(),
  speciesId: z.string().uuid(),
  sex: z.enum(['MALE', 'FEMALE']),
  birthDate: z.string().transform((s) => new Date(s)),
  sireId: z.string().uuid().nullable().optional(),
  damId: z.string().uuid().nullable().optional(),
});

router.get('/', requireAuth, async (_req, res) => {
  const animals = await prisma.animal.findMany({ include: { species: true } });
  res.json(animals);
});

router.post('/', requireAuth, requireRoles(['admin', 'manager']), async (req, res) => {
  const parsed = animalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const created = await prisma.animal.create({ data: parsed.data });
  res.status(201).json(created);
});

router.get('/:id', requireAuth, async (req, res) => {
  const animal = await prisma.animal.findUnique({ where: { id: req.params.id }, include: { weights: true } });
  if (!animal) return res.status(404).json({ error: 'Not found' });
  res.json(animal);
});

router.put('/:id', requireAuth, requireRoles(['admin', 'manager']), async (req, res) => {
  const data = animalSchema.partial().safeParse(req.body);
  if (!data.success) return res.status(400).json({ error: data.error.flatten() });
  const updated = await prisma.animal.update({ where: { id: req.params.id }, data: data.data });
  res.json(updated);
});

router.delete('/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
  await prisma.animal.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

router.post('/:id/weights', requireAuth, async (req, res) => {
  const { weightKg, measuredAt, notes } = req.body as { weightKg: number; measuredAt?: string; notes?: string };
  if (!weightKg) return res.status(400).json({ error: 'weightKg required' });
  const log = await prisma.weightLog.create({ data: { animalId: req.params.id, weightKg, measuredAt: measuredAt ? new Date(measuredAt) : undefined, notes } });
  res.status(201).json(log);
});
