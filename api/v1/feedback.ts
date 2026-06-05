import { error, handleOptions, ok } from '../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return error(res, 405, 'Method not allowed');

  return ok(res, {
    message: 'Feedback received',
    received_at: new Date().toISOString(),
    payload: req.body ?? {},
  }, 201);
}
