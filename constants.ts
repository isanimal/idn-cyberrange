import { Module, User, UserRole, Cheatsheet, Lab, Challenge, Lesson } from './types';

// SIMULATED DATABASE
export const MOCK_USERS_DB = [
  {
    id: 'u1',
    name: 'Neo Anderson',
    email: 'user@example.com',
    password: 'password', // Plaintext for demo purposes
    role: UserRole.USER,
    points: 1337,
    completedModules: 2,
    rank: 'Script Kiddie',
    avatarUrl: 'https://picsum.photos/seed/neo/200/200'
  },
  {
    id: 'a1',
    name: 'Morpheus Admin',
    email: 'admin@example.com',
    password: 'admin',
    role: UserRole.ADMIN,
    points: 9999,
    completedModules: 10,
    rank: 'Operator',
    avatarUrl: 'https://picsum.photos/seed/morpheus/200/200'
  }
];

export const MOCK_USER: User = MOCK_USERS_DB[0]; // Fallback

export const MODULES: Module[] = [
  {
    id: 'm1',
    slug: 'intro-pentesting',
    title: 'M1: Introduction & Ethics',
    description: 'Basics of Web Security, Ethics, Pentest Cycles, and Scoping.',
    level: 'Basic',
    order: 1,
    progress: 100,
    isLocked: false,
    tags: ['Ethics', 'Scope']
  },
  {
    id: 'm2',
    slug: 'http-security',
    title: 'M2: HTTP/HTTPS & Headers',
    description: 'Understanding structure, security headers (HSTS, CSP), and traffic flow.',
    level: 'Basic',
    order: 2,
    progress: 45,
    isLocked: false,
    tags: ['Network', 'Headers']
  },
  {
    id: 'm3',
    slug: 'sql-injection',
    title: 'M3: SQL Injection',
    description: 'Risk assessment, manual exploitation, and remediation of SQLi.',
    level: 'Intermediate',
    order: 3,
    progress: 0,
    isLocked: true,
    tags: ['Injection', 'Database']
  },
  {
    id: 'm4',
    slug: 'burp-suite',
    title: 'M4: Burp Suite Fundamentals',
    description: 'Mastering Proxy, Repeater, and Intruder tools.',
    level: 'Basic',
    order: 4,
    progress: 0,
    isLocked: true,
    tags: ['Tools']
  },
  {
    id: 'm5',
    slug: 'other-injections',
    title: 'M5: Advanced Injections',
    description: 'Command Injection, LDAP, XML/XXE, and NoSQL attacks.',
    level: 'Advanced',
    order: 5,
    progress: 0,
    isLocked: true,
    tags: ['Injection']
  },
  {
    id: 'm6',
    slug: 'xss',
    title: 'M6: Cross-Site Scripting (XSS)',
    description: 'Reflected, Stored, and DOM-based XSS attacks and defenses.',
    level: 'Intermediate',
    order: 6,
    progress: 0,
    isLocked: true,
    tags: ['Client-side']
  }
];

export const MOCK_LESSONS: Lesson[] = [
  {
    id: 'ls1',
    moduleId: 'm1',
    title: 'What is Penetration Testing?',
    contentMd: '# Introduction\nPentesting is the practice of testing a computer system...',
    estimatedTime: '10 min'
  },
  {
    id: 'ls2',
    moduleId: 'm1',
    title: 'Legal & Ethics',
    contentMd: '# Rules of Engagement\nAlways get written permission before testing...',
    estimatedTime: '15 min'
  },
  {
    id: 'ls3',
    moduleId: 'm2',
    title: 'HTTP Request & Response',
    contentMd: '# HTTP Protocol\nUnderstanding verbs like GET, POST, PUT...',
    estimatedTime: '20 min'
  }
];

export const MOCK_LABS: Record<string, Lab[]> = {
  'm2': [
    {
      id: 'l1',
      moduleId: 'm2',
      title: 'Insecure Headers Lab',
      difficulty: 'Easy',
      type: 'docker',
      status: 'STOPPED'
    },
    {
      id: 'l2',
      moduleId: 'm2',
      title: 'Traffic Interception Basic',
      difficulty: 'Medium',
      type: 'docker',
      status: 'STOPPED'
    }
  ]
};

export const MOCK_CHALLENGES: Record<string, Challenge[]> = {
  'l1': [
    {
      id: 'c1',
      labId: 'l1',
      title: 'Identify the missing header',
      description: 'Connect to the target and identify which critical security header is missing.',
      points: 50,
      solved: true,
      flagFormatHint: 'FLAG{header_name}'
    },
    {
      id: 'c2',
      labId: 'l1',
      title: 'Exploit the weakness',
      description: 'Use the missing header to embed a frame.',
      points: 100,
      solved: false,
      flagFormatHint: 'FLAG{random_string}'
    }
  ]
};

export const MOCK_THEORY_MD = `
# HTTP Security Headers

Security headers are HTTP response headers that, when set, can tell the browser to provide an extra layer of security.

## Common Headers

1. **Strict-Transport-Security (HSTS)**
   - Enforces HTTPS connections.
   - Prevents SSL Stripping attacks.

2. **Content-Security-Policy (CSP)**
   - Mitigates XSS and Data Injection attacks.
   - Controls resources the user agent is allowed to load.

3. **X-Frame-Options**
   - Prevents Clickjacking.
   - Directives: \`DENY\`, \`SAMEORIGIN\`.

## Lab Objectives

In the associated lab, you will analyze a vulnerable server that lacks these headers and observe the browser behavior.
`;

export const MOCK_CHEATSHEETS: Cheatsheet[] = [
  { id: 'cs1', title: 'Common Ports', category: 'Network', content: '21: FTP\n22: SSH\n80: HTTP\n443: HTTPS' },
  { id: 'cs2', title: 'SQLi Payloads', category: 'Injection', content: "' OR 1=1--\n' UNION SELECT NULL, version()--" },
];

export const MOCK_BADGES = [
  { id: 'b1', name: 'First Blood', description: 'Solved your first challenge', icon: 'Sword', date: '2023-10-01' },
  { id: 'b2', name: 'Header Hunter', description: 'Completed HTTP Security Module', icon: 'Shield', date: '2023-10-05' },
  { id: 'b3', name: 'SQL Sorcerer', description: 'Performed a Union Based Injection', icon: 'Database', date: '2023-11-12' },
  { id: 'b4', name: 'Night Owl', description: 'Completed a lab between 2AM and 5AM', icon: 'Moon', date: '2023-12-01' },
];

export const MOCK_ACTIVITY_LOG = [
  { id: 1, action: 'Solved Challenge', target: 'Identify the missing header', points: 50, date: '2 hours ago' },
  { id: 2, action: 'Completed Lab', target: 'Insecure Headers Lab', points: 0, date: '2 hours ago' },
  { id: 3, action: 'Started Module', target: 'M2: HTTP/HTTPS & Headers', points: 0, date: '1 day ago' },
  { id: 4, action: 'Logged In', target: 'System', points: 0, date: '1 day ago' },
  { id: 5, action: 'Earned Badge', target: 'First Blood', points: 10, date: '5 days ago' },
];