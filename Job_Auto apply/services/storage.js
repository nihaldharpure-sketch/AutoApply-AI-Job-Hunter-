// ============================================================
// Storage Service — localStorage wrapper
// ============================================================

const KEYS = {
  PROFILE:      'autoapply_profile',
  RESUME:       'autoapply_resume',
  APPLICATIONS: 'autoapply_applications',
  SETTINGS:     'autoapply_settings',
  SAVED_JOBS:   'autoapply_saved_jobs',
};

export const Storage = {
  // ── Profile ──────────────────────────────────────────────
  getProfile() {
    return JSON.parse(localStorage.getItem(KEYS.PROFILE) || 'null');
  },
  saveProfile(profile) {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  // ── Resume ───────────────────────────────────────────────
  getResume() {
    return JSON.parse(localStorage.getItem(KEYS.RESUME) || 'null');
  },
  saveResume(resumeData) {
    localStorage.setItem(KEYS.RESUME, JSON.stringify(resumeData));
  },

  // ── Applications ─────────────────────────────────────────
  getApplications() {
    return JSON.parse(localStorage.getItem(KEYS.APPLICATIONS) || '[]');
  },
  addApplication(app) {
    const apps = this.getApplications();
    const newApp = {
      id:          Date.now().toString(),
      appliedAt:   new Date().toISOString(),
      status:      'Applied',
      ...app,
    };
    apps.unshift(newApp);
    localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(apps));
    return newApp;
  },
  updateApplication(id, updates) {
    const apps = this.getApplications();
    const idx  = apps.findIndex(a => a.id === id);
    if (idx !== -1) {
      apps[idx] = { ...apps[idx], ...updates };
      localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(apps));
    }
  },
  deleteApplication(id) {
    const apps = this.getApplications().filter(a => a.id !== id);
    localStorage.setItem(KEYS.APPLICATIONS, JSON.stringify(apps));
  },

  // ── Saved Jobs ───────────────────────────────────────────
  getSavedJobs() {
    return JSON.parse(localStorage.getItem(KEYS.SAVED_JOBS) || '[]');
  },
  toggleSaveJob(job) {
    const saved = this.getSavedJobs();
    const idx   = saved.findIndex(j => j.id === job.id);
    if (idx === -1) {
      saved.push(job);
    } else {
      saved.splice(idx, 1);
    }
    localStorage.setItem(KEYS.SAVED_JOBS, JSON.stringify(saved));
    return idx === -1; // true = saved, false = unsaved
  },
  isJobSaved(jobId) {
    return this.getSavedJobs().some(j => j.id === jobId);
  },

  // ── Settings ─────────────────────────────────────────────
  getSettings() {
    return JSON.parse(localStorage.getItem(KEYS.SETTINGS) || 'null') || {
      rapidApiKey:     '',
      adzunaAppId:     '',
      adzunaAppKey:    '',
      autoMode:        false,
      coverLetter:     'Dear Hiring Manager,\n\nI am excited to apply for the {role} position at {company}...',
      defaultLocation: 'India',
      jobTypes:        ['Full-time'],
      experienceLevel: ['Mid-Senior level'],
    };
  },
  saveSettings(settings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // ── Clear All ────────────────────────────────────────────
  clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },
};
