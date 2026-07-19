import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { z } from 'zod';
import { 
  createUser, findUserByEmail, findUserById, 
  createRefreshToken, findRefreshToken, revokeRefreshToken, revokeAllUserTokens 
} from '../repositories/userRepository.js';
import { signToken } from '../middleware/auth.js';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function register(req, res) {
  const body = registerSchema.parse(req.body);
  const existing = await findUserByEmail(body.email);

  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await createUser({ name: body.name, email: body.email, passwordHash });
  
  const token = signToken(user);
  const refreshToken = generateRefreshToken();
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  
  await createRefreshToken(user.id, hashToken(refreshToken), expiresAt);

  return res.status(201).json({ user, token, refreshToken });
}

export async function login(req, res) {
  const body = loginSchema.parse(req.body);
  const user = await findUserByEmail(body.email);

  if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const publicUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  const token = signToken(publicUser);
  const refreshToken = generateRefreshToken();
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await createRefreshToken(user.id, hashToken(refreshToken), expiresAt);

  return res.json({ user: publicUser, token, refreshToken });
}

export async function refresh(req, res) {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  const tokenHash = hashToken(refreshToken);
  const tokenRecord = await findRefreshToken(tokenHash);

  if (!tokenRecord) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const user = await findUserById(tokenRecord.user_id);
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists' });
  }

  // Revoke the old refresh token to prevent reuse (rotation)
  await revokeRefreshToken(tokenHash);

  // Generate new pair
  const newJwt = signToken(user);
  const newRefreshToken = generateRefreshToken();
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await createRefreshToken(user.id, hashToken(newRefreshToken), expiresAt);

  return res.json({ user, token: newJwt, refreshToken: newRefreshToken });
}

export async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await revokeRefreshToken(hashToken(refreshToken));
  }
  // Additionally, if we wanted to revoke all tokens for user on "logout all devices":
  // if (req.user) await revokeAllUserTokens(req.user.id);
  
  return res.status(204).send();
}

export async function me(req, res) {
  const user = await findUserById(req.user.id);
  return res.json({ user });
}
