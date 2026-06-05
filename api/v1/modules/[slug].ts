import { handleOptions, lessons, modules, ok, requireUser } from '../../../lib/core';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res)) return;
  const user = requireUser(req, res);
  if (!user) return;

  const slug = String(req.query?.slug ?? '');
  const moduleItem = modules.find((item) => item.slug === slug) ?? modules[0];
  const moduleLessons = lessons.filter((lesson) => lesson.module_id === moduleItem.id);

  return ok(res, {
    ...moduleItem,
    resume_lesson_id: moduleLessons[0]?.id ?? null,
    lessons: moduleLessons,
    labs: [],
  });
}
