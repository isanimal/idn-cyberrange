import { handleOptions, ok } from '../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return ok(res, { message: 'Method not allowed' }, 405);
  return ok(res, { message: 'Logged out' });
}
