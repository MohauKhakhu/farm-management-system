import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@farm/db';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

router.post('/register', async (req, res) => {
  const { email, password, name, roles } = req.body as {
    email: string; password: string; name: string; roles?: string[];
  };
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hash, name } });
  if (roles && roles.length > 0) {
    const upsertedRoles = await Promise.all(
      roles.map((r) => prisma.role.upsert({ where: { name: r }, update: {}, create: { name: r } }))
    );
    await prisma.userRole.createMany({ data: upsertedRoles.map((r) => ({ userId: user.id, roleId: r.id })) });
  }
  return res.json({ id: user.id, email: user.email, name: user.name });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ where: { email }, include: { roles: { include: { role: true } } } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const roleNames = user.roles.map((ur) => ur.role.name);
  const token = jwt.sign({ sub: user.id, email: user.email, roles: roleNames }, JWT_SECRET, { expiresIn: '12h' });
  return res.json({ token, user: { id: user.id, email: user.email, name: user.name, roles: roleNames } });
});

export { router };
