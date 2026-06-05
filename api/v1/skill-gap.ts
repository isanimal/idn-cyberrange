import { analyzeCareer, error, handleOptions, ok } from '../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return error(res, 405, 'Method not allowed');

  const { input, target_role } = req.body ?? {};
  const result = analyzeCareer(String(input ?? target_role ?? 'frontend developer'));

  return ok(res, {
    target_role: result.target_role,
    owned_skills: result.owned_skills,
    weak_skills: result.weak_skills,
    missing_skills: result.missing_skills,
    priority: [
      { skill: result.missing_skills[0], priority: 'high', reason: 'Dibutuhkan untuk mulai membangun portfolio.' },
      { skill: result.weak_skills[0], priority: 'medium', reason: 'Perlu diperkuat agar proses belajar berikutnya lebih stabil.' },
    ],
  });
}
