import { handleOptions, ok, requireUser } from '../../../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  const user = requireUser(req, res);
  if (!user) return;

  return ok(res, { data: [] });
}
