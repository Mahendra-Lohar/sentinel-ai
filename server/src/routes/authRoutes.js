import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { login, me, register, refresh, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

export const authRoutes = Router();

authRoutes.post('/register', asyncHandler(register));
authRoutes.post('/login', asyncHandler(login));
authRoutes.post('/refresh', asyncHandler(refresh));
authRoutes.post('/logout', asyncHandler(logout));
authRoutes.get('/me', requireAuth, asyncHandler(me));
