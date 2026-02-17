# API v1

Base path: `/api/v1`

## Auth
- `POST /login`
- `POST /register`
- `POST /logout`
- `GET /me`

## Labs (User)
- `GET /labs?search=&difficulty=&category=&tag=&sort=&page=&limit=`
- `GET /labs/{id_or_slug}`
- `POST /labs/{id}/activate` body: `{ pin_version?: string }`
- `POST /labs/{id_or_slug}/start` body: `{ pin_version?: string }`
- `POST /labs/{id_or_slug}/stop`
- `GET /labs/{id}/challenges`
- `GET /labs/instances/my`
- `GET /labs/instances/{instance_id}`
- `GET /me/lab-instances?state=&page=&limit=`
- `POST /lab-instances/{instance_id}/deactivate`
- `POST /lab-instances/{instance_id}/restart`
- `PATCH /lab-instances/{instance_id}` body: `{ notes?, progress_percent?, state? }`
- `POST /lab-instances/{instance_id}/upgrade` body: `{ to_version?: string, strategy: IN_PLACE|RESET }`

## Challenges
- `POST /challenges/{challenge_id}/submit` body: `{ flag: string }`

## Admin
- `GET/POST/PATCH/DELETE /admin/labs`
- `POST /admin/labs/{id}/publish` body: `{ version, notes }`
- `POST /admin/labs/{id}/archive`
- `GET/POST/PATCH/DELETE /admin/challenges`
- `GET /admin/users`
- `GET /admin/users?includeDeleted=0|1`
- `PATCH /admin/users/{id}` body: `{ status?: ACTIVE|SUSPENDED, reset_attempts?: bool }`
- `PATCH /admin/users/{id}/suspend`
- `PATCH /admin/users/{id}/unsuspend`
- `DELETE /admin/users/{id}` (soft delete: sets `deleted_at`, revokes tokens)
- `POST /admin/users/{id}/restore`
- `GET /admin/orchestration/instances`
- `GET /admin/orchestration/overview`
- `POST /admin/orchestration/instances/{instance_id}/force-stop`

## Modules (User)
- `GET /modules`
  - visible modules only (`PUBLISHED`)
  - response: `{ data: [{ id, slug, title, description, difficulty, category, est_minutes, status, version, tags, cover_icon, order_index, lessons_count, progress_percent, is_locked, locked_reason, completed_at }] }`
- `GET /modules/{slug}`
  - response includes module metadata + lessons summary:
  - `{ id, slug, title, description, difficulty, category, est_minutes, status, version, tags, cover_icon, order_index, progress_percent, is_locked, resume_lesson_id, lessons: [{ id, title, content_md, order, status, percent, is_completed, started_at, completed_at, last_seen_at }] }`
- `GET /modules/{slug}/lessons/{lessonId}`
  - returns single lesson detail with user progress:
  - `{ data: { id, module_id, module_slug, title, content_md, order, status, percent, is_completed, started_at, completed_at, last_seen_at, tasks: [{id,title,order_index,points,is_done,done_at}], assets: [{id,type,url,caption,order_index}] } }`
- `GET /lessons/{lessonId}`
  - same payload as lesson detail endpoint above
- `POST /lessons/{lessonId}/progress`
  - body: `{ status: NOT_STARTED|IN_PROGRESS|COMPLETED, percent?: 0..100 }`
  - updates per-user lesson progress and recalculates module progress
- `POST /lessons/{lessonId}/reading-event`
  - body: `{ event: OPEN|SCROLL|HEARTBEAT, percentViewed?: 0..100 }`
  - updates reading-based progress; module progress recalculated
- `POST /lessons/{lessonId}/complete`
  - shortcut endpoint to complete a lesson by id
- `POST /tasks/{taskId}/toggle`
  - toggle user task completion and recalc lesson/module progress
- `POST /modules/{slug}/start`
  - idempotent start/continue module progress
  - response: `{ data: { module_id, progress_percent, started_at, completed_at } }`
- `POST /modules/{slug}/lessons/{lessonId}/complete`
  - marks lesson complete and recalculates module progress
  - response: `{ data: { module_id, lesson_id, progress_percent, completed_at } }`

## Modules (Admin)
- `GET /admin/modules?status=DRAFT|PUBLISHED|ARCHIVED&per_page=20`
  - paginated response: `{ data: [...], meta: { page, per_page, total } }`
- `POST /admin/modules`
  - body: `{ title, slug?, description?, difficulty: BASIC|INTERMEDIATE|ADVANCED, category?, est_minutes?, status?: DRAFT|PUBLISHED|ARCHIVED, version?, tags?: string[], cover_icon?, order_index }`
- `GET /admin/modules/{id}`
  - response includes module + lessons
- `PATCH /admin/modules/{id}`
  - partial update of module fields
- `DELETE /admin/modules/{id}`
  - hard delete
- `POST /admin/modules/{id}/publish`
  - validates minimum publish requirements (title, slug, >=1 lesson)
- `POST /admin/modules/{id}/archive`
- `GET /admin/modules/{id}/lessons`
- `POST /admin/modules/{id}/lessons`
  - body: `{ title, content_md, order, is_active? }`
- `PATCH /admin/modules/{id}/lessons/{lesson_id}`
- `DELETE /admin/modules/{id}/lessons/{lesson_id}`
- `GET /admin/modules/{id}/lessons/{lesson_id}`
- `PATCH /admin/lessons/{id}`
- `DELETE /admin/lessons/{id}`
- `POST /admin/lessons/{lesson_id}/tasks`
  - body: `{ title, order_index, points? }`
- `PATCH /admin/tasks/{task_id}`
- `DELETE /admin/tasks/{task_id}`
- `POST /admin/lessons/{lesson_id}/assets`
  - body: `{ type: IMAGE, url, caption?, order_index }`
- `PATCH /admin/assets/{asset_id}`
- `DELETE /admin/assets/{asset_id}`

## Error model
- `422` validation error
- `403` forbidden
- `409` conflict
- `429` submission/attempt/cooldown throttles

## User Access Policy
- Authenticated users with `status != ACTIVE` or `deleted_at != null` are blocked from user feature endpoints (`/modules`, `/labs`, `/lab-instances`, `/challenges`) with `403`.
