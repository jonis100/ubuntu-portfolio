/**
 * Single source of truth for everything about Yoni. The About app, the SEO
 * block, the login screen and several Terminal commands all read from here.
 */

export type ExperienceEntry = {
  period: string;
  role: string;
  org: string;
  summary: string;
  stack: string[];
};

export type SkillGroup = {
  label: string;
  items: string[];
};

export const profile = {
  name: 'Yoni Shieber',
  initials: 'YS',
  headline: 'Software Developer',
  subhead: 'Ex-Cyber Crime Investigator',
  tagline:
    'I used to chase hackers for the Israeli Police. Now I build backend systems and write tools so AI agents can do my job faster than I can.',

  username: 'yoni',
  hostname: 'portfolio',
  location: 'Tel Aviv District, Israel',

  bio: [
    "I'm a software developer at Optimove, building backend services, data pipelines and internal tools with TypeScript, NestJS and React. Before I started building things for a living, I spent a few years breaking them — investigating cybercrime for Israel's Lahav 433 unit.",
    "These days I'm deep into AI-powered development workflows. I built a Claude quota tracker for VS Code (because knowing how much AI you've consumed is peak developer self-awareness) and an MCP server that lets AI agents talk to public APIs. I believe the best developers aren't being replaced by AI — they're the ones building the bridges between AI and everything else.",
    'B.Sc. Computer Science from the Open University. Fueled by curiosity, black coffee and the quiet satisfaction of a clean git log.',
  ],

  education: 'B.Sc. Computer Science — The Open University of Israel',

  stats: [
    { value: '5+', label: 'Years in Tech' },
    { value: '2', label: 'Careers Merged' },
    { value: '100K+', label: 'LinkedIn Views on DForce' },
    { value: '∞', label: 'Claude Tokens Burned' },
  ],

  // TODO(yoni): confirm the exact start/end dates for the two most recent roles.
  experience: [
    {
      period: '2025 — Present',
      role: 'Software Developer',
      org: 'Optimove',
      summary:
        'Building and maintaining backend services and internal tooling for a customer-led marketing platform, with a focus on data-heavy pipelines and reliability.',
      stack: ['TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
    },
    {
      period: '2022 — 2025',
      role: 'Fullstack / Backend Developer',
      org: 'Vim Healthcare',
      summary:
        'Built backend services, data pipelines and internal tooling for a healthcare platform used by millions. Implemented Auth0 integrations, automated E2E testing with Playwright, and optimised CI/CD workflows.',
      stack: [
        'TypeScript',
        'NestJS',
        'React',
        'Python',
        'Airflow',
        'PostgreSQL',
        'Auth0',
        'Playwright',
      ],
    },
    {
      period: '2019 — 2022',
      role: 'Cyber Crime Investigator',
      org: 'Israel Police — Lahav 433 Cyber Unit',
      summary:
        'Investigated complex cybercrime cases involving fraud, phishing and blockchain-related offences. Developed custom Python tooling for network forensics and data analysis. Earned OSCP. Learned that criminals also write terrible code.',
      stack: ['Python', 'Networking', 'Forensics', 'Blockchain', 'OSCP'],
    },
    {
      period: '2021',
      role: 'Developer & Co-Founder',
      org: 'Google for Startups Accelerator — Privasee',
      summary:
        "Selected for Google's accelerator programme. Built a spy-detection device designed to protect at-risk women from surveillance, combining hardware sensors with software analysis to identify hidden recording devices.",
      stack: ['IoT', 'Signal Processing', 'Social Impact'],
    },
  ] satisfies ExperienceEntry[],

  skills: [
    { label: 'Languages', items: ['TypeScript', 'Python', 'JavaScript', 'Java', 'C', 'SQL'] },
    { label: 'Backend', items: ['Node.js', 'NestJS', 'FastAPI', 'GraphQL', 'REST APIs', 'Airflow'] },
    { label: 'Frontend', items: ['React', 'HTML / CSS', 'Tailwind', 'Responsive Design'] },
    { label: 'Infrastructure', items: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'PostgreSQL', 'Redis'] },
    { label: 'Observability', items: ['OpenTelemetry', 'Prometheus', 'Grafana'] },
    { label: 'Security', items: ['OSCP', 'Network Forensics', 'Penetration Testing', 'Auth0'] },
    { label: 'AI & Tools', items: ['Claude Code', 'MCP Servers', 'LLM Agents', 'Playwright', 'Git'] },
  ] satisfies SkillGroup[],

  certifications: [
    'OSCP — Offensive Security Certified Professional',
    'AI Performance Engineering Fellowship — Nebius Academy',
    'LLM Architectures — Nebius Academy',
    'MLOps — Nebius Academy',
    'AI Agents — Nebius Academy',
  ],

  links: {
    github: 'https://github.com/jonis100',
    githubUser: 'jonis100',
    linkedin: 'https://www.linkedin.com/in/yoni-shieber/',
    email: 'jonishei100@gmail.com',
    privasee: 'https://privaseeai.com',
  },
} as const;

/** Used by neofetch and the About app's spec sheet. */
export const systemInfo = {
  os: 'Ubuntu 24.04 LTS (web edition)',
  kernel: 'react-18.3.1',
  shell: 'portfolio-sh 1.0',
  de: 'GNOME 46',
  theme: 'Yaru-dark',
  terminal: 'gnome-terminal',
};
