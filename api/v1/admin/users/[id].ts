import { demoUsers, error, handleOptions, ok, requireAdmin } from '../../../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const id = String(req.query?.id ?? '');
  const user = demoUsers.find((item) => item.id === id) ?? demoUsers[1];

  if (req.method === 'GET') return ok(res, user);
  if (req.method === 'PATCH') return ok(res, { ...user, ...req.body, updated_at: new Date().toISOString() });
  if (req.method === 'DELETE') return ok(res, undefined, 204);

  return error(res, 405, 'Method not allowed');
}
