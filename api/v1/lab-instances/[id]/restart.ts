import { handleOptions, ok, requireUser } from '../../../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  const user = requireUser(req, res);
  if (!user) return;
  const id = String(req.query?.id ?? `instance-${Date.now()}`);
  return ok(res, {
    id,
    user_id: user.id,
    status: 'RUNNING',
    endpoint_url: 'https://incompana.vercel.app',
    public_url: 'https://incompana.vercel.app',
    restarted_at: new Date().toISOString(),
  });
}
