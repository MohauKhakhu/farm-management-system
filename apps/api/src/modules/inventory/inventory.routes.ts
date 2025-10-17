import { Router } from 'express';
import prisma from '@farm/db';
import { requireAuth, requireRoles } from '../auth/middleware';

export const router = Router();

router.get('/items', requireAuth, async (_req, res) => {
  const items = await prisma.inventoryItem.findMany({ include: { lots: true } });
  res.json(items);
});

router.post('/items', requireAuth, requireRoles(['admin', 'manager']), async (req, res) => {
  const { name, category, unit, reorderLevel } = req.body as any;
  const item = await prisma.inventoryItem.create({ data: { name, category, unit, reorderLevel: Number(reorderLevel || 0) } });
  res.status(201).json(item);
});

router.post('/items/:itemId/lots', requireAuth, requireRoles(['admin', 'manager']), async (req, res) => {
  const { quantity, batchNo, expiryDate } = req.body as any;
  const lot = await prisma.stockLot.create({ data: { itemId: req.params.itemId, quantity: Number(quantity), batchNo, expiryDate: expiryDate ? new Date(expiryDate) : null } });
  res.status(201).json(lot);
});

router.get('/alerts/reorder', requireAuth, async (_req, res) => {
  const items = await prisma.inventoryItem.findMany({ include: { lots: true } });
  const alerts = items.map((it) => {
    const total = it.lots.reduce((s, l) => s + l.quantity, 0);
    const needs = total <= it.reorderLevel;
    return { itemId: it.id, name: it.name, category: it.category, totalQuantity: total, reorderLevel: it.reorderLevel, needsReorder: needs };
  }).filter(a => a.needsReorder);
  res.json(alerts);
});
