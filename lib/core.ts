export type Role = 'USER' | 'ADMIN';
export type Status = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  points: number;
  completedModules: number;
}

type Req = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

type Res = {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  end: () => void;
  setHeader: (key: string, value: string) => void;
};

const now = () => new Date().toISOString();

export const demoUsers: UserDTO[] = [
  {
    id: 'user-admin-001',
    name: 'Admin Compana',
    email: 'admin@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: now(),
    updated_at: now(),
    deleted_at: null,
    points: 1200,
    completedModules: 8,
  },
  {
    id: 'user-demo-001',
    name: 'Demo User',
    email: 'student@idn.id',
    role: 'USER',
    status: 'ACTIVE',
    created_at: now(),
    updated_at: now(),
    deleted_at: null,
    points: 340,
    completedModules: 2,
  },
];

export const modules = [
  {
    id: 'mod-career-001',
    title: 'Career Direction Foundation',
    slug: 'career-direction-foundation',
    description: 'Memahami arah karier, skill gap, dan prioritas belajar pertama.',
    difficulty: 'BASIC',
    level: 'BASIC',
    status: 'PUBLISHED',
    category: 'Career Readiness',
    est_minutes: 45,
    version: '1.0.0',
    tags: ['career', 'self-assessment', 'learning-path'],
    cover_icon: 'Compass',
    order_index: 1,
    lessons_count: 3,
    progress_percent: 0,
    is_locked: false,
  },
  {
    id: 'mod-ai-001',
    title: 'AI Assisted Learning Path',
    slug: 'ai-assisted-learning-path',
    description: 'Membuat roadmap belajar dengan bantuan AI dan feedback loop.',
    difficulty: 'INTERMEDIATE',
    level: 'INTERMEDIATE',
    status: 'PUBLISHED',
    category: 'AI Productivity',
    est_minutes: 60,
    version: '1.0.0',
    tags: ['ai', 'roadmap', 'productivity'],
    cover_icon: 'Brain',
    order_index: 2,
    lessons_count: 3,
    progress_percent: 0,
    is_locked: false,
  },
];

export const lessons = [
  {
    id: 'lesson-career-001',
    module_id: 'mod-career-001',
    module_slug: 'career-direction-foundation',
    title: 'Mengenali kondisi awal pengguna',
    content_md: 'Mulai dari menuliskan kondisi, hambatan, skill saat ini, dan target 6 bulan.',
    order: 1,
    is_completed: false,
    status: 'NOT_STARTED',
    percent: 0,
  },
  {
    id: 'lesson-career-002',
    module_id: 'mod-career-001',
    module_slug: 'career-direction-foundation',
    title: 'Memetakan target role',
    content_md: 'Bandingkan minat, waktu belajar, dan peluang role untuk menentukan prioritas.',
    order: 2,
    is_completed: false,
    status: 'NOT_STARTED',
    percent: 0,
  },
  {
    id: 'lesson-ai-001',
    module_id: 'mod-ai-001',
    module_slug: 'ai-assisted-learning-path',
    title: 'Membuat prompt learning path',
    content_md: 'Gunakan konteks persona dan skill gap untuk menghasilkan roadmap belajar.',
    order: 1,
    is_completed: false,
    status: 'NOT_STARTED',
    percent: 0,
  },
];

export const labs = [
  {
    id: 'lab-compana-demo',
    title: 'Compana Career Analysis Demo',
    slug: 'compana-career-analysis-demo',
    difficulty: 'Easy',
    category: 'AI Career Companion',
    estimated_time_minutes: 20,
    est_minutes: 20,
    short_description: 'Simulasi analisis kondisi pengguna menjadi rekomendasi karier.',
    long_description: 'Lab ini memperlihatkan alur input bebas, pertanyaan lanjutan, skill gap, dan action plan.',
    tags: ['ai', 'career', 'skill-gap'],
    objectives: ['Mengenali persona', 'Membaca skill gap', 'Membuat 3 langkah awal'],
    prerequisites: ['Akun demo Compana'],
    version: '1.0.0',
    status: 'PUBLISHED',
    internal_port: 80,
    docker_compose_yaml: 'services:\n  app:\n    image: nginx:alpine\n',
    configuration: { type: 'docker-compose', base_port: 80 },
  },
];

export function setCors(res: Res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handleOptions(req: Req, res: Res): boolean {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export function ok(res: Res, body: unknown, code = 200) {
  setCors(res);
  return res.status(code).json(body);
}

export function error(res: Res, code: number, message: string, details?: unknown) {
  setCors(res);
  return res.status(code).json({ message, details });
}

export function createToken(user: UserDTO): string {
  const payload = {
    user,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function readUser(req: Req): UserDTO | null {
  const header = req.headers.authorization ?? req.headers.Authorization;
  const value = Array.isArray(header) ? header[0] : header;
  if (!value || !value.startsWith('Bearer ')) return null;

  try {
    const token = value.replace('Bearer ', '').trim();
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as { user: UserDTO; exp: number };
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload.user;
  } catch {
    return null;
  }
}

export function requireUser(req: Req, res: Res): UserDTO | null {
  const user = readUser(req);
  if (!user) {
    error(res, 401, 'Unauthorized');
    return null;
  }
  return user;
}

export function requireAdmin(req: Req, res: Res): UserDTO | null {
  const user = requireUser(req, res);
  if (!user) return null;
  if (user.role !== 'ADMIN') {
    error(res, 403, 'Forbidden');
    return null;
  }
  return user;
}

export function analyzeCareer(input: string, answers?: unknown) {
  const normalized = input.toLowerCase();
  let target_role = 'Frontend Developer';
  if (normalized.includes('data')) target_role = 'Data Analyst';
  if (normalized.includes('security') || normalized.includes('cyber')) target_role = 'Cyber Security Analyst';
  if (normalized.includes('ui') || normalized.includes('ux')) target_role = 'UI/UX Designer';
  if (normalized.includes('backend') || normalized.includes('api')) target_role = 'Backend Developer';

  const skillMap: Record<string, { owned: string[]; weak: string[]; missing: string[] }> = {
    'Frontend Developer': {
      owned: ['HTML Basic', 'CSS Basic'],
      weak: ['JavaScript', 'Git'],
      missing: ['React', 'REST API', 'Portfolio Project'],
    },
    'Data Analyst': {
      owned: ['Spreadsheet Basic'],
      weak: ['SQL', 'Python Basic'],
      missing: ['Data Visualization', 'Statistics', 'Portfolio Dashboard'],
    },
    'Cyber Security Analyst': {
      owned: ['Networking Basic'],
      weak: ['Linux', 'Log Analysis'],
      missing: ['SIEM', 'Threat Hunting', 'Incident Response Workflow'],
    },
    'UI/UX Designer': {
      owned: ['Design Interest'],
      weak: ['User Research', 'Wireframing'],
      missing: ['Figma Portfolio', 'Usability Testing', 'Design System'],
    },
    'Backend Developer': {
      owned: ['Programming Basic'],
      weak: ['API Design', 'Database'],
      missing: ['Authentication', 'Deployment', 'Testing'],
    },
  };

  const skills = skillMap[target_role];

  return {
    persona: normalized.includes('fresh') || normalized.includes('lulus') ? 'fresh_graduate' : 'career_switcher',
    current_level: 'beginner',
    target_role,
    problem_category: 'direction_confused',
    confidence_score: 0.82,
    summary: `Pengguna membutuhkan arahan belajar yang lebih terstruktur untuk masuk ke jalur ${target_role}.`,
    owned_skills: skills.owned,
    weak_skills: skills.weak,
    missing_skills: skills.missing,
    followup_questions: [
      'Berapa jam per minggu yang bisa kamu alokasikan untuk belajar?',
      'Apakah kamu lebih suka belajar melalui video, membaca, atau praktik project?',
      'Target apa yang ingin kamu capai dalam 3 sampai 6 bulan ke depan?',
    ],
    recommended_steps: [
      `Pelajari fondasi utama untuk role ${target_role} selama 2 minggu.`,
      'Buat satu project kecil sebagai bukti kemampuan awal.',
      'Susun portfolio dan minta feedback dari mentor atau komunitas.',
    ],
    learning_path: [
      { week: 1, topic: 'Fondasi role dan terminology', output: 'Catatan konsep utama' },
      { week: 2, topic: 'Skill dasar dan latihan kecil', output: 'Mini project' },
      { week: 3, topic: 'Project portfolio pertama', output: 'Portfolio publishable' },
      { week: 4, topic: 'Review, perbaikan, dan next roadmap', output: 'Roadmap 30 hari berikutnya' },
    ],
    received_answers: answers ?? null,
  };
}

export function paginate<T>(data: T[], pageRaw: unknown, perPage = 10) {
  const page = Math.max(Number(Array.isArray(pageRaw) ? pageRaw[0] : pageRaw) || 1, 1);
  const start = (page - 1) * perPage;
  return {
    data: data.slice(start, start + perPage),
    meta: {
      current_page: page,
      last_page: Math.max(Math.ceil(data.length / perPage), 1),
      total: data.length,
      per_page: perPage,
    },
  };
}
