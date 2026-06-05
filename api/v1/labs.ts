import { handleOptions, labs, ok, paginate, requireUser } from '../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  const user = requireUser(req, res);
  if (!user) return;

  if (req.method !== 'GET') return ok(res, { message: 'Method not allowed' }, 405);
  return ok(res, paginate(labs, req.query?.page, 20));
}
