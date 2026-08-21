// ============================================================
// Job API Service
// Primary:  JSearch via RapidAPI (LinkedIn, Indeed, Glassdoor)
// Fallback: Realistic mock data
// ============================================================

import { Storage }           from './storage.js';
import { calculateMatchScore } from './resume-parser.js';

const JSEARCH_BASE = 'https://jsearch.p.rapidapi.com';

// ── Mock Job Data ─────────────────────────────────────────────────────────────
const MOCK_JOBS = [
  {
    id: 'mock-1',
    title: 'Frontend Developer',
    company: 'TechNova Solutions',
    location: 'Bangalore, Karnataka',
    type: 'Full-time',
    level: 'Mid-Senior',
    salary: '₹8L - ₹14L/year',
    postedAt: '2 hours ago',
    logo: 'https://ui-avatars.com/api/?name=TN&background=6366f1&color=fff&bold=true',
    description: 'We are looking for a skilled Frontend Developer proficient in React, JavaScript, TypeScript, CSS, HTML, and modern web tooling. Experience with Next.js and GraphQL is a plus.',
    skills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'HTML', 'Next.js'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Frontend+Developer',
    source: 'LinkedIn',
    easyApply: true,
  },
  {
    id: 'mock-2',
    title: 'Full Stack Engineer',
    company: 'InnovateTech India',
    location: 'Pune, Maharashtra',
    type: 'Full-time',
    level: 'Senior',
    salary: '₹12L - ₹20L/year',
    postedAt: '5 hours ago',
    logo: 'https://ui-avatars.com/api/?name=IT&background=8b5cf6&color=fff&bold=true',
    description: 'Join our growing team to build scalable full-stack applications using Node.js, React, Python, AWS, and PostgreSQL. Strong knowledge of REST APIs and microservices required.',
    skills: ['Node.js', 'React', 'Python', 'AWS', 'PostgreSQL', 'REST'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Full+Stack+Engineer',
    source: 'LinkedIn',
    easyApply: true,
  },
  {
    id: 'mock-3',
    title: 'Software Development Engineer',
    company: 'Amazon India',
    location: 'Hyderabad, Telangana',
    type: 'Full-time',
    level: 'Mid-Senior',
    salary: '₹18L - ₹35L/year',
    postedAt: '1 day ago',
    logo: 'https://ui-avatars.com/api/?name=AZ&background=f59e0b&color=fff&bold=true',
    description: 'Build world-class distributed systems using Java, AWS, Docker, Kubernetes, and CI/CD pipelines. Strong CS fundamentals and data structure knowledge required.',
    skills: ['Java', 'AWS', 'Docker', 'Kubernetes', 'Python', 'SQL'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=SDE+Amazon',
    source: 'Indeed',
    easyApply: false,
  },
  {
    id: 'mock-4',
    title: 'React Developer',
    company: 'Infosys Digital',
    location: 'Chennai, Tamil Nadu',
    type: 'Full-time',
    level: 'Junior-Mid',
    salary: '₹5L - ₹10L/year',
    postedAt: '3 hours ago',
    logo: 'https://ui-avatars.com/api/?name=IF&background=10b981&color=fff&bold=true',
    description: 'Looking for a React.js Developer with hands-on experience in Redux, TypeScript, REST APIs, Git, and Agile development practices.',
    skills: ['React', 'Redux', 'TypeScript', 'JavaScript', 'Git', 'Agile'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=React+Developer+Infosys',
    source: 'LinkedIn',
    easyApply: true,
  },
  {
    id: 'mock-5',
    title: 'Backend Engineer — Python',
    company: 'Razorpay',
    location: 'Remote, India',
    type: 'Full-time',
    level: 'Mid-Senior',
    salary: '₹15L - ₹25L/year',
    postedAt: '12 hours ago',
    logo: 'https://ui-avatars.com/api/?name=RP&background=3b82f6&color=fff&bold=true',
    description: 'Build and scale payment infrastructure using Python, Django, FastAPI, PostgreSQL, Redis, Kafka, and AWS. You will own the backend for critical fintech features.',
    skills: ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Redis', 'AWS'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Backend+Python+Razorpay',
    source: 'Glassdoor',
    easyApply: false,
  },
  {
    id: 'mock-6',
    title: 'DevOps Engineer',
    company: 'Wipro Limited',
    location: 'Noida, Uttar Pradesh',
    type: 'Full-time',
    level: 'Mid-Senior',
    salary: '₹8L - ₹16L/year',
    postedAt: '2 days ago',
    logo: 'https://ui-avatars.com/api/?name=WP&background=ef4444&color=fff&bold=true',
    description: 'Manage CI/CD pipelines, cloud infrastructure, and container orchestration using AWS, Docker, Kubernetes, Terraform, Ansible, Jenkins, and Linux.',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Linux'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=DevOps+Wipro',
    source: 'Indeed',
    easyApply: true,
  },
  {
    id: 'mock-7',
    title: 'Data Scientist',
    company: 'Mu Sigma Analytics',
    location: 'Bangalore, Karnataka',
    type: 'Full-time',
    level: 'Mid-Senior',
    salary: '₹10L - ₹18L/year',
    postedAt: '6 hours ago',
    logo: 'https://ui-avatars.com/api/?name=MS&background=0ea5e9&color=fff&bold=true',
    description: 'Apply ML/AI to large-scale analytics problems using Python, TensorFlow, PyTorch, SQL, Tableau, and Spark.',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Tableau', 'Spark'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Data+Scientist+Mu+Sigma',
    source: 'LinkedIn',
    easyApply: true,
  },
  {
    id: 'mock-8',
    title: 'UI/UX + Frontend Developer',
    company: 'Swiggy',
    location: 'Bangalore, Karnataka',
    type: 'Full-time',
    level: 'Mid-Senior',
    salary: '₹12L - ₹22L/year',
    postedAt: '1 day ago',
    logo: 'https://ui-avatars.com/api/?name=SW&background=f97316&color=fff&bold=true',
    description: 'Design and develop seamless user experiences for millions of users using React, TypeScript, Figma, CSS, and A/B testing tools.',
    skills: ['React', 'TypeScript', 'Figma', 'CSS', 'HTML', 'JavaScript'],
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Frontend+UI+Swiggy',
    source: 'LinkedIn',
    easyApply: true,
  },
];

// ── API Fetch ─────────────────────────────────────────────────────────────────
export async function searchJobs(query = '', location = '', filters = {}) {
  const settings = Storage.getSettings();

  if (settings.rapidApiKey) {
    try {
      return await fetchFromJSearch(query, location, filters, settings.rapidApiKey);
    } catch (e) {
      console.warn('JSearch failed, using mock data:', e.message);
    }
  }

  return filterMockJobs(query, location, filters);
}

async function fetchFromJSearch(query, location, filters, apiKey) {
  const params = new URLSearchParams({
    query:    `${query} ${location}`.trim() || 'Software Developer India',
    page:     '1',
    num_pages:'1',
    date_posted: filters.datePosted || 'all',
  });

  const response = await fetch(`${JSEARCH_BASE}/search?${params}`, {
    headers: {
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      'x-rapidapi-key':  apiKey,
    },
  });

  if (!response.ok) throw new Error(`JSearch error: ${response.status}`);

  const data = await response.json();
  return (data.data || []).map(job => ({
    id:          job.job_id,
    title:       job.job_title,
    company:     job.employer_name,
    location:    `${job.job_city || ''}, ${job.job_country || ''}`.trim().replace(/^,\s*/, ''),
    type:        job.job_employment_type || 'Full-time',
    level:       job.job_required_experience?.required_experience_in_months > 36 ? 'Senior' : 'Mid-Senior',
    salary:      job.job_min_salary ? `$${job.job_min_salary} - $${job.job_max_salary}` : 'Competitive',
    postedAt:    formatRelativeTime(job.job_posted_at_datetime_utc),
    logo:        job.employer_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.employer_name?.slice(0,2) || 'JB')}&background=6366f1&color=fff`,
    description: job.job_description || '',
    skills:      job.job_required_skills || [],
    applyUrl:    job.job_apply_link || job.job_google_link || '#',
    source:      job.job_publisher || 'JSearch',
    easyApply:   job.job_apply_is_direct || false,
  }));
}

function filterMockJobs(query, location, filters) {
  let jobs = [...MOCK_JOBS];
  const q  = (query || '').toLowerCase();
  const l  = (location || '').toLowerCase();

  if (q) {
    jobs = jobs.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.description.toLowerCase().includes(q) ||
      j.skills.some(s => s.toLowerCase().includes(q))
    );
  }
  if (l) {
    jobs = jobs.filter(j => j.location.toLowerCase().includes(l) || j.location.toLowerCase().includes('remote'));
  }
  if (filters.easyApply) {
    jobs = jobs.filter(j => j.easyApply);
  }
  if (filters.source) {
    jobs = jobs.filter(j => j.source === filters.source);
  }

  return jobs;
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  const h    = Math.floor(diff / 3600000);
  if (h < 24) return `${h} hour${h !== 1 ? 's' : ''} ago`;
  const d    = Math.floor(h / 24);
  return `${d} day${d !== 1 ? 's' : ''} ago`;
}

/**
 * Enrich jobs with match scores based on resume skills
 */
export function enrichWithMatchScore(jobs, resumeSkills = []) {
  return jobs.map(job => ({
    ...job,
    matchScore: calculateMatchScore(resumeSkills, job.description + ' ' + job.skills.join(' ')),
  })).sort((a, b) => b.matchScore - a.matchScore);
}
