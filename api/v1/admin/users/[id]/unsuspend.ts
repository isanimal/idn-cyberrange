import { demoUsers, handleOptions, ok, requireAdmin } from '../../../../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const id = String(req.query?.id ?? '');
  const user = demoUsers.find((item) => item.id === id) ?? demoUsers[1];
  return ok(res, { ...user, status: 'ACTIVE', updated_at: new Date().toISOString() });
}
