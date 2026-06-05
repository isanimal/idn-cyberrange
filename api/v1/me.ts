import { handleOptions, ok, requireUser } from '../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'GET') return ok(res, { message: 'Method not allowed' }, 405);

  const user = requireUser(req, res);
  if (!user) return;
  return ok(res, user);
}
