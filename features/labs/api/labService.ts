import { LabTemplate, LabDetailResponse, LabInstance, LabStatus, LabDifficulty, LabChangelog, LabConfiguration } from '../types';

// Mock delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const STORAGE_KEY_LABS = 'mock_lab_templates';

// DEFAULT DOCKER TEMPLATE
const DEFAULT_COMPOSE = `version: '3'
services:
  webapp:
    image: vulnerables/web-dvwa
    ports:
      - "\${PORT}:80"
    restart: always
    environment:
      - FLAG=IDN_LAB{DYNAMIC_FLAG}
`;

// INITIAL SEED DATA
const SEED_LABS: LabTemplate[] = [
  {
    id: 'l-1',
    slug: 'dvwa-docker',
    title: 'Damn Vulnerable Web App (DVWA)',
    difficulty: LabDifficulty.EASY,
    category: 'Web Security',
    short_description: 'A PHP/MySQL web application that is damn vulnerable.',
    long_description: '# DVWA \n\nMain goal is to aid security professionals to test their skills and tools in a legal environment.',
    prerequisites: ['Basic HTML', 'HTTP Protocol'],
    estimated_time_minutes: 60,
    objectives: ['SQL Injection', 'XSS', 'CSRF'],
    tags: ['OWASP Top 10', 'PHP'],
    version: '2024.1.0',
    status: LabStatus.PUBLISHED,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    configuration: {
      type: 'docker-compose',
      content: DEFAULT_COMPOSE,
      base_port: 80
    },
    changelog: [
      { version: '2024.1.0', date: '2023-01-01', notes: 'Initial Release' }
    ]
  },
  {
    id: 'l-2',
    slug: 'eternal-blue',
    title: 'SMB Exploitation: EternalBlue',
    difficulty: LabDifficulty.HARD,
    category: 'Network',
    short_description: 'Exploit MS17-010 in a controlled Windows environment.',
    long_description: '# EternalBlue \n\nLearn to exploit the SMBv1 vulnerability.',
    prerequisites: ['Network Basics', 'Metasploit'],
    estimated_time_minutes: 120,
    objectives: ['Scan SMB', 'Exploit MS17-010', 'Gain Shell'],
    tags: ['CVE-2017-0144', 'Windows'],
    version: '2024.2.1',
    status: LabStatus.PUBLISHED,
    configuration: {
      type: 'docker-compose',
      content: DEFAULT_COMPOSE.replace('vulnerables/web-dvwa', 'appsecco/dovs'), // Mock content
      base_port: 445
    },
    created_at: '2023-02-01',
    updated_at: '2023-06-01',
    changelog: [
       { version: '2024.2.1', date: '2023-06-01', notes: 'Patch updates' }
    ]
  }
];

// Helper to access storage
const getStoredLabs = (): LabTemplate[] => {
  const stored = localStorage.getItem(STORAGE_KEY_LABS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_LABS, JSON.stringify(SEED_LABS));
    return SEED_LABS;
  }
  return JSON.parse(stored);
};

const saveLabs = (labs: LabTemplate[]) => {
  localStorage.setItem(STORAGE_KEY_LABS, JSON.stringify(labs));
};

// --- LOGIC PORT ALLOCATOR (SIMULASI) ---
// Dalam production, ini akan mengecek Redis atau Docker API untuk port yang sedang dipakai
const findAvailablePort = (): number => {
  // Return random port between 20000 and 30000
  return Math.floor(Math.random() * (30000 - 20000 + 1) + 20000);
};

export const labService = {
  // --- PUBLIC / USER METHODS ---

  getLabs: async (filters?: any): Promise<LabTemplate[]> => {
    await delay(500);
    let data = getStoredLabs();
    
    if (!filters?.includeDrafts) {
       data = data.filter(l => l.status === LabStatus.PUBLISHED);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(l => 
        l.title.toLowerCase().includes(q) || 
        l.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return data;
  },

  getLabDetail: async (id: string): Promise<LabDetailResponse> => {
    await delay(500);
    const labs = getStoredLabs();
    const lab = labs.find(l => l.id === id || l.slug === id);
    if (!lab) throw new Error('Lab not found');
    
    const instanceKey = `instance_${lab.id}`;
    const instanceStr = localStorage.getItem(instanceKey);
    
    return {
      ...lab,
      user_instance: instanceStr ? JSON.parse(instanceStr) : null
    };
  },

  activateLab: async (labId: string): Promise<LabInstance> => {
    await delay(1500); // Simulate spinning up container
    const labs = getStoredLabs();
    const lab = labs.find(l => l.id === labId);
    if (!lab) throw new Error('Lab not found');

    // 1. ALLOCATE PORT
    const assignedPort = findAvailablePort();
    const host = '10.10.14.22'; // Mock VPN IP

    // 2. PREPARE CONFIGURATION (Mocking backend logic)
    // Di backend nyata: 
    // const finalCompose = lab.configuration.content.replace('${PORT}', assignedPort);
    // fs.writeFileSync(`/tmp/${instanceId}/docker-compose.yml`, finalCompose);
    // exec(`docker compose -f ... up -d`)

    console.log(`[ORCHESTRATOR] Starting Lab ${lab.title}`);
    console.log(`[ORCHESTRATOR] Assigned Port: ${assignedPort}`);
    console.log(`[ORCHESTRATOR] Template Used:`, lab.configuration?.content);

    const newInstance: LabInstance = {
      instance_id: `inst-${Date.now()}`,
      user_id: 'current-user',
      lab_template_id: lab.id,
      template_version_pinned: lab.version,
      state: 'ACTIVE' as any,
      progress_percent: 0,
      started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      attempts_count: 1,
      notes: '',
      assigned_port: assignedPort,
      connection_url: `http://${host}:${assignedPort}`
    };
    
    localStorage.setItem(`instance_${lab.id}`, JSON.stringify(newInstance));
    return newInstance;
  },

  deactivateLab: async (instanceId: string, labId: string): Promise<void> => {
    await delay(500);
    // Di backend nyata: exec(`docker compose down`)
    const stored = localStorage.getItem(`instance_${labId}`);
    if (stored) {
      const updated = { ...JSON.parse(stored), state: 'INACTIVE', assigned_port: undefined, connection_url: undefined };
      localStorage.setItem(`instance_${labId}`, JSON.stringify(updated));
    }
  },

  updateInstance: async (labId: string, data: Partial<LabInstance>): Promise<LabInstance> => {
    await delay(300);
    const stored = localStorage.getItem(`instance_${labId}`);
    if (!stored) throw new Error('Instance not found');
    const updated = { ...JSON.parse(stored), ...data, last_activity_at: new Date().toISOString() };
    localStorage.setItem(`instance_${labId}`, JSON.stringify(updated));
    return updated;
  },

  // --- ADMIN METHODS ---

  getAllLabsAdmin: async (): Promise<LabTemplate[]> => {
    await delay(500);
    return getStoredLabs();
  },

  createLab: async (data: Partial<LabTemplate>): Promise<LabTemplate> => {
    await delay(500);
    const labs = getStoredLabs();
    
    const newLab: LabTemplate = {
      id: `l-${Date.now()}`,
      slug: data.slug || `lab-${Date.now()}`,
      title: data.title || 'Untitled Lab',
      difficulty: data.difficulty || LabDifficulty.EASY,
      category: data.category || 'General',
      short_description: data.short_description || '',
      long_description: data.long_description || '# New Lab',
      prerequisites: data.prerequisites || [],
      estimated_time_minutes: data.estimated_time_minutes || 60,
      objectives: data.objectives || [],
      tags: data.tags || [],
      version: '0.0.1',
      status: LabStatus.DRAFT,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      changelog: [],
      configuration: {
        type: 'docker-compose',
        content: DEFAULT_COMPOSE,
        base_port: 80
      },
      ...data
    } as LabTemplate;

    saveLabs([...labs, newLab]);
    return newLab;
  },

  updateLab: async (id: string, data: Partial<LabTemplate>): Promise<LabTemplate> => {
    await delay(500);
    const labs = getStoredLabs();
    const idx = labs.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Lab not found');

    const updated = {
      ...labs[idx],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    labs[idx] = updated;
    saveLabs(labs);
    return updated;
  },

  publishLab: async (id: string, version: string, notes: string): Promise<LabTemplate> => {
    await delay(800);
    const labs = getStoredLabs();
    const idx = labs.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Lab not found');

    const lab = labs[idx];
    const entry: LabChangelog = {
      version,
      date: new Date().toISOString(),
      notes
    };

    const updated = {
      ...lab,
      version,
      status: LabStatus.PUBLISHED,
      updated_at: new Date().toISOString(),
      changelog: [entry, ...(lab.changelog || [])]
    };

    labs[idx] = updated;
    saveLabs(labs);
    return updated;
  },

  archiveLab: async (id: string): Promise<void> => {
    await delay(300);
    const labs = getStoredLabs();
    const idx = labs.findIndex(l => l.id === id);
    if (idx !== -1) {
      labs[idx].status = LabStatus.ARCHIVED;
      saveLabs(labs);
    }
  },

  deleteLab: async (id: string): Promise<void> => {
    await delay(500);
    const labs = getStoredLabs();
    const filtered = labs.filter(l => l.id !== id);
    saveLabs(filtered);
  }
};
