import { createToken, demoUsers, error, handleOptions, ok } from '../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return error(res, 405, 'Method not allowed');

  const { email, password } = req.body ?? {};
  if (!email || !password) return error(res, 400, 'Email and password are required');

  const normalizedEmail = String(email).toLowerCase().trim();
  const user = demoUsers.find((item) => item.email.toLowerCase() === normalizedEmail)
    ?? {
      id: `user-${Buffer.from(normalizedEmail).toString('base64url').slice(0, 10)}`,
      name: normalizedEmail.includes('admin') ? 'Admin Compana' : 'Compana User',
      email: normalizedEmail,
      role: normalizedEmail.includes('admin') ? 'ADMIN' as const : 'USER' as const,
      status: 'ACTIVE' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      points: 0,
      completedModules: 0,
    };

  if (user.status !== 'ACTIVE') return error(res, 403, 'User is not active');

  return ok(res, {
    token: createToken(user),
    token_type: 'Bearer',
    user,
  });
}
