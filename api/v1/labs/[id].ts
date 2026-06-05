import { handleOptions, labs, ok, requireUser } from '../../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  const user = requireUser(req, res);
  if (!user) return;

  const id = String(req.query?.id ?? '');
  const lab = labs.find((item) => item.id === id || item.slug === id) ?? labs[0];
  return ok(res, { data: lab });
}
