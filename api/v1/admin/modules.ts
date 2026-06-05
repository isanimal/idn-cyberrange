import { error, handleOptions, modules, ok, requireAdmin } from '../../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'GET') return ok(res, { data: modules });
  if (req.method === 'POST') {
    return ok(res, {
      id: `mod-${Date.now()}`,
      lessons_count: 0,
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...req.body,
    }, 201);
  }

  return error(res, 405, 'Method not allowed');
}
