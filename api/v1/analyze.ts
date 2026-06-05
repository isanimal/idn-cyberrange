import { analyzeCareer, error, handleOptions, ok } from '../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return error(res, 405, 'Method not allowed');

  const { input, answers } = req.body ?? {};
  if (!input || String(input).trim().length < 3) {
    return error(res, 400, 'Input is required');
  }

  return ok(res, analyzeCareer(String(input), answers));
}
