// ============================================================
// Auto Apply Service
// ============================================================

import { Storage } from './storage.js';

/**
 * Apply to a single job.
 * Mode A (default): Records application + opens LinkedIn Easy Apply in new tab.
 * Mode B (auto):    Sends job to auto-apply queue for batch processing.
 *
 * @param {Object} job      - Job object from job-api.js
 * @param {Object} profile  - User profile
 * @param {Object} options  - { mode: 'manual'|'auto', coverLetter }
 * @returns {Object} Application record
 */
export async function applyToJob(job, profile, options = {}) {
  const { mode = 'manual' } = options;

  // Check if already applied
  const existing = Storage.getApplications().find(a => a.jobId === job.id);
  if (existing) {
    throw new Error('Already applied to this job');
  }

  // Record the application
  const appRecord = Storage.addApplication({
    jobId:       job.id,
    title:       job.title,
    company:     job.company,
    location:    job.location,
    salary:      job.salary,
    source:      job.source,
    applyUrl:    job.applyUrl,
    matchScore:  job.matchScore,
    easyApply:   job.easyApply,
    status:      'Applied',
    notes:       '',
  });

  // Build apply URL with pre-filled params where possible
  const applyUrl = buildApplyUrl(job, profile);

  if (mode === 'manual') {
    // Open the application link in a new tab
    window.open(applyUrl, '_blank');
  }

  return appRecord;
}

/**
 * Apply to multiple jobs in batch (Auto mode)
 */
export async function autoBatchApply(jobs, profile, onProgress) {
  const results = { success: [], failed: [], skipped: [] };

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    onProgress?.(i + 1, jobs.length, job);

    // Skip if already applied
    const existing = Storage.getApplications().find(a => a.jobId === job.id);
    if (existing) {
      results.skipped.push(job);
      continue;
    }

    try {
      await applyToJob(job, profile, { mode: 'auto' });
      results.success.push(job);
      // Throttle to avoid overwhelming
      await sleep(800 + Math.random() * 400);
    } catch (e) {
      results.failed.push({ job, error: e.message });
    }
  }

  return results;
}

/**
 * Build a smart apply URL
 */
function buildApplyUrl(job, profile) {
  // For LinkedIn Easy Apply jobs, link directly
  if (job.source === 'LinkedIn') {
    const search = encodeURIComponent(`${job.title} ${job.company}`);
    return `https://www.linkedin.com/jobs/search/?keywords=${search}&f_AL=true`;
  }
  return job.applyUrl || '#';
}

/**
 * Generate a personalized cover letter
 */
export function generateCoverLetter(job, profile) {
  const settings = Storage.getSettings();
  const template = settings.coverLetter ||
    `Dear Hiring Manager,\n\nI am excited to apply for the {role} position at {company}. With my background in {skills}, I am confident I can contribute meaningfully to your team.\n\nBest regards,\n{name}`;

  return template
    .replace(/\{role\}/g,    job.title)
    .replace(/\{company\}/g, job.company)
    .replace(/\{skills\}/g,  (profile?.skills || []).slice(0, 3).join(', ') || 'software development')
    .replace(/\{name\}/g,    profile?.name || 'Nihal Dharpure')
    .replace(/\{location\}/g, job.location)
    .replace(/\{date\}/g,    new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }));
}

/**
 * Get application statistics
 */
export function getStats(applications) {
  const total      = applications.length;
  const applied    = applications.filter(a => a.status === 'Applied').length;
  const interviews = applications.filter(a => a.status === 'Interview').length;
  const offers     = applications.filter(a => a.status === 'Offer').length;
  const rejected   = applications.filter(a => a.status === 'Rejected').length;
  const pending    = applications.filter(a => a.status === 'Pending').length;

  return { total, applied, interviews, offers, rejected, pending };
}

/**
 * Get applications by day (for chart)
 */
export function getApplicationsByDay(applications, days = 7) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date  = new Date();
    date.setDate(date.getDate() - i);
    const label = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const count = applications.filter(a => {
      const d = new Date(a.appliedAt);
      return d.toDateString() === date.toDateString();
    }).length;
    result.push({ label, count });
  }
  return result;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
