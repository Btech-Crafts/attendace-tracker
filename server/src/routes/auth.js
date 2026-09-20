import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { signToken } from '../lib/auth.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, targetPercentage } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        targetPercentage: Number.isFinite(Number(targetPercentage)) ? Number(targetPercentage) : 75
      }
    });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET is not configured on the server' });
    }

    const token = signToken(user, process.env.JWT_SECRET);
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        targetPercentage: user.targetPercentage
      }
    });
  } catch (error) {
    console.error('[auth/register] failed:', error);
    return res.status(500).json({ message: 'Signup failed', error: error?.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }


  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'JWT_SECRET is not configured on the server' });
  }

  const token = signToken(user, process.env.JWT_SECRET);
  return res.json({

    token,
    user: {
      id: user.id,
      username: user.username,
      targetPercentage: user.targetPercentage
    }
  });
});

router.get('/me', requireAuth, async (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      targetPercentage: req.user.targetPercentage
    }
  });
});

router.put('/me', requireAuth, async (req, res) => {
  try {
    const { targetPercentage } = req.body;
    const parsedTarget = Number(targetPercentage);

    if (!Number.isFinite(parsedTarget)) {
      return res.status(400).json({ message: 'Target percentage must be a number' });
    }

    if (parsedTarget < 1 || parsedTarget > 100) {
      return res.status(400).json({ message: 'Target percentage must be between 1 and 100' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { targetPercentage: parsedTarget }
    });

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        targetPercentage: user.targetPercentage
      }
    });
  } catch (error) {
    console.error('[auth/me] update failed:', error);
    return res.status(500).json({ message: 'Unable to update target percentage', error: error?.message });
  }
});

export default router;
