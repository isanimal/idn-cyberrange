import { handleOptions, labs, ok, requireUser } from '../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  const user = requireUser(req, res);
  if (!user) return;
  if (req.method !== 'POST') return ok(res, { message: 'Method not allowed' }, 405);

  const labTemplateId = req.body?.lab_template_id ?? labs[0].id;
  const lab = labs.find((item) => item.id === labTemplateId) ?? labs[0];
  return ok(res, {
    id: `instance-${Date.now()}`,
    lab_template_id: lab.id,
    user_id: user.id,
    status: 'RUNNING',
    endpoint_url: 'https://incompana.vercel.app',
    public_url: 'https://incompana.vercel.app',
    started_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    lab_template: lab,
  }, 201);
}
