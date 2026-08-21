// ============================================================
// Settings Page
// ============================================================

import { Storage } from '../services/storage.js';

export function renderSettings(container) {
  const settings = Storage.getSettings();
  const profile  = Storage.getProfile() || {};

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="page-sub">Configure your profile, API keys, and auto-apply preferences</p>
      </div>
    </div>

    <div class="settings-grid">
      <!-- Profile Settings -->
      <div class="settings-card">
        <div class="settings-section-header">
          <div class="settings-icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <div>
            <h3 class="settings-title">Profile Information</h3>
            <p class="settings-desc">Your personal and professional details</p>
          </div>
        </div>
        <div class="settings-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-input" id="set-name" value="${profile.name || 'Nihal Dharpure'}" />
            </div>
            <div class="form-group">
              <label class="form-label">Job Title</label>
              <input type="text" class="form-input" id="set-title" value="${profile.title || 'Software Developer'}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" id="set-email" value="${profile.email || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" class="form-input" id="set-phone" value="${profile.phone || ''}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">LinkedIn URL</label>
            <input type="url" class="form-input" id="set-linkedin" value="${profile.linkedin || 'https://www.linkedin.com/in/nihaldharpure/'}" />
          </div>
          <div class="form-group">
            <label class="form-label">Location</label>
            <input type="text" class="form-input" id="set-location" value="${profile.location || 'India'}" />
          </div>
          <div class="form-group">
            <label class="form-label">Skills (comma-separated)</label>
            <input type="text" class="form-input" id="set-skills" value="${(profile.skills || []).join(', ')}" />
          </div>
          <div class="form-group">
            <label class="form-label">Professional Summary</label>
            <textarea class="form-textarea" id="set-summary" rows="4">${profile.summary || ''}</textarea>
          </div>
          <button class="btn btn-primary" id="save-profile-btn">Save Profile</button>
        </div>
      </div>

      <div class="settings-right">
        <!-- API Keys -->
        <div class="settings-card">
          <div class="settings-section-header">
            <div class="settings-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
            </div>
            <div>
              <h3 class="settings-title">API Keys</h3>
              <p class="settings-desc">Connect real job data sources</p>
            </div>
          </div>
          <div class="settings-form">
            <div class="form-group">
              <label class="form-label">
                RapidAPI Key 
                <a href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch" target="_blank" class="form-link">Get free key →</a>
              </label>
              <div class="input-with-toggle">
                <input type="password" class="form-input" id="set-rapid-key" value="${settings.rapidApiKey || ''}" placeholder="Enter your RapidAPI key for real job data" />
                <button class="toggle-btn" onclick="togglePassword('set-rapid-key', this)">👁</button>
              </div>
              <p class="form-hint">Free tier: 500 requests/month. Unlocks real LinkedIn, Indeed & Glassdoor jobs.</p>
            </div>
            <button class="btn btn-outline" id="save-api-btn">Save API Keys</button>
          </div>
        </div>

        <!-- Auto Apply Preferences -->
        <div class="settings-card">
          <div class="settings-section-header">
            <div class="settings-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div>
              <h3 class="settings-title">Auto Apply Preferences</h3>
              <p class="settings-desc">Configure how the bot applies on your behalf</p>
            </div>
          </div>
          <div class="settings-form">
            <div class="form-group">
              <label class="form-label">Default Location</label>
              <input type="text" class="form-input" id="set-def-location" value="${settings.defaultLocation || 'India'}" />
            </div>
            <div class="form-group">
              <label class="form-label">Minimum Match Score to Auto-Apply</label>
              <div class="slider-wrap">
                <input type="range" class="form-range" id="set-min-score" min="0" max="100" value="${settings.minScore || 60}" />
                <span class="range-val" id="score-val">${settings.minScore || 60}%</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Cover Letter Template</label>
              <textarea class="form-textarea" id="set-cover" rows="7">${settings.coverLetter || 'Dear Hiring Manager,\n\nI am excited to apply for the {role} position at {company}. With my skills in {skills}, I am confident I can contribute meaningfully to your team.\n\nBest regards,\n{name}'}</textarea>
              <p class="form-hint">Variables: {role}, {company}, {skills}, {name}, {location}, {date}</p>
            </div>
            <button class="btn btn-primary" id="save-prefs-btn">Save Preferences</button>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="settings-card danger-card">
          <div class="settings-section-header">
            <div class="settings-icon red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h3 class="settings-title">Danger Zone</h3>
              <p class="settings-desc">Irreversible actions</p>
            </div>
          </div>
          <div class="settings-form">
            <button class="btn btn-danger" id="clear-apps-btn">Clear All Applications</button>
            <button class="btn btn-danger" id="clear-all-btn" style="margin-top:8px">Reset All Data</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Range slider live value
  const rangeEl  = document.getElementById('set-min-score');
  const rangeVal = document.getElementById('score-val');
  rangeEl?.addEventListener('input', () => { rangeVal.textContent = rangeEl.value + '%'; });

  // Save profile
  document.getElementById('save-profile-btn')?.addEventListener('click', () => {
    const existing = Storage.getProfile() || {};
    Storage.saveProfile({
      ...existing,
      name:     document.getElementById('set-name')?.value || existing.name,
      title:    document.getElementById('set-title')?.value || existing.title,
      email:    document.getElementById('set-email')?.value || existing.email,
      phone:    document.getElementById('set-phone')?.value || existing.phone,
      linkedin: document.getElementById('set-linkedin')?.value || existing.linkedin,
      location: document.getElementById('set-location')?.value || existing.location,
      skills:   (document.getElementById('set-skills')?.value || '').split(',').map(s => s.trim()).filter(Boolean),
      summary:  document.getElementById('set-summary')?.value || existing.summary,
    });
    showToast('Profile saved!');
  });

  // Save API keys
  document.getElementById('save-api-btn')?.addEventListener('click', () => {
    const existing = Storage.getSettings();
    Storage.saveSettings({ ...existing, rapidApiKey: document.getElementById('set-rapid-key')?.value || '' });
    showToast('API key saved! Refresh job search to use real data.');
  });

  // Save preferences
  document.getElementById('save-prefs-btn')?.addEventListener('click', () => {
    const existing = Storage.getSettings();
    Storage.saveSettings({
      ...existing,
      defaultLocation: document.getElementById('set-def-location')?.value || 'India',
      minScore:        parseInt(document.getElementById('set-min-score')?.value) || 60,
      coverLetter:     document.getElementById('set-cover')?.value || existing.coverLetter,
    });
    showToast('Preferences saved!');
  });

  // Clear apps
  document.getElementById('clear-apps-btn')?.addEventListener('click', () => {
    if (!confirm('Delete all application records?')) return;
    localStorage.removeItem('autoapply_applications');
    showToast('Applications cleared', 'warn');
  });

  // Reset all
  document.getElementById('clear-all-btn')?.addEventListener('click', () => {
    if (!confirm('This will delete ALL data including your profile and resume. Continue?')) return;
    Storage.clearAll();
    showToast('All data cleared. Reloading...', 'warn');
    setTimeout(() => location.reload(), 1500);
  });
}

window.togglePassword = (id, btn) => {
  const input = document.getElementById(id);
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁'; }
};

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className   = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}
