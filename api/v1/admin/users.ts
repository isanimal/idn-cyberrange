import { demoUsers, error, handleOptions, ok, paginate, requireAdmin } from '../../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    return ok(res, paginate(demoUsers, req.query?.page, 10));
  }

  if (req.method === 'POST') {
    const payload = req.body ?? {};
    const user = {
      id: `user-${Date.now()}`,
      name: payload.name ?? 'New User',
      email: payload.email ?? `user-${Date.now()}@compana.local`,
      role: payload.role ?? 'USER',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      points: 0,
      completedModules: 0,
    };
    return ok(res, user, 201);
  }

  return error(res, 405, 'Method not allowed');
}
