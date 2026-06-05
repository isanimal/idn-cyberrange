import { handleOptions, ok } from '../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  return ok(res, {
    status: 'ok',
    service: 'Backend-Compana',
    environment: process.env.NODE_ENV ?? 'development',
    timestamp: new Date().toISOString(),
  });
}
