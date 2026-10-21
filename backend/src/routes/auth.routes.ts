// Routes d'authentification.
// Pratiques : P20. ASVS V6 (auth), V7 (sessions). Limitation de débit stricte
// (authLimiter) contre le bourrage d'identifiants et la force brute (T01, T02).

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { registerSchema, loginSchema } from '../validation/schemas.js';
import * as authService from '../services/auth.service.js';
import { UnauthorizedError } from '../errors/AppError.js';
import type { RegisterInput, LoginInput } from '../validation/schemas.js';

export const authRouter = Router();

// Le jeton de rafraîchissement est transporté par cookie httpOnly : inaccessible
// au JavaScript du navigateur (défense XSS/vol de jeton, T07, ASVS 7.1.1).
const REFRESH_COOKIE = 'refresh_token';
const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Lecture du cookie par ACCÈS LITTÉRAL (pas d'indexation dynamique) : la clé
// n'est jamais dérivée d'une entrée client.
function readRefreshCookie(req: import('express').Request): string | undefined {
  const cookies = req.cookies as { refresh_token?: string } | undefined;
  return cookies?.refresh_token;
}

authRouter.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as RegisterInput;
    const result = await authService.register(input.email, input.password, req.ip);
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions);
    res.status(201).json({ accessToken: result.accessToken, user: result.user });
  }),
);

authRouter.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as LoginInput;
    const result = await authService.login(input.email, input.password, req.ip);
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions);
    res.status(200).json({ accessToken: result.accessToken, user: result.user });
  }),
);

authRouter.post(
  '/refresh',
  authLimiter,
  asyncHandler(async (req, res) => {
    const presented = readRefreshCookie(req);
    if (!presented) {
      throw new UnauthorizedError('Session invalide.');
    }
    const result = await authService.refresh(presented, req.ip);
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions);
    res.status(200).json({ accessToken: result.accessToken, user: result.user });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const presented = readRefreshCookie(req);
    if (presented) {
      await authService.logout(presented, req.ip);
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.status(204).send();
  }),
);
