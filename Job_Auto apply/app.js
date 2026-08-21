// ============================================================
// App.js — Main Router & Shell
// ============================================================

import { renderOnboarding } from './pages/onboarding.js';
import { renderJobSearch }  from './pages/job-search.js';
import { renderDashboard }  from './pages/dashboard.js';
import { renderSettings }   from './pages/settings.js';
import { Storage }          from './services/storage.js';

// ── Navigation State ─────────────────────────────────────────
let currentPage = 'onboarding';

const PAGES = {
  onboarding: { label: 'Setup',     icon: userIcon() },
  jobs:       { label: 'Find Jobs', icon: searchIcon() },
  dashboard:  { label: 'Dashboard', icon: chartIcon() },
  settings:   { label: 'Settings',  icon: settingsIcon() },
};

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initShell();

  // Decide start page
  const hasProfile = Storage.getProfile() || Storage.getResume();
  navigate(hasProfile ? 'jobs' : 'onboarding');
});

// ── Shell ──────────────────────────────────────────────────────
function initShell() {
  document.getElementById('app').innerHTML = `
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <div class="logo-mark">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" width="22" height="22">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div class="logo-text">
            <div class="logo-name">AutoApply</div>
            <div class="logo-sub">AI Job Hunter</div>
          </div>
        </div>
      </div>

      <!-- Profile mini card -->
      <div class="sidebar-profile" id="sidebar-profile" onclick="window._navigate('settings')">
        <div class="sidebar-avatar" id="sidebar-avatar">ND</div>
        <div>
          <div class="sidebar-name" id="sidebar-uname">Nihal Dharpure</div>
          <div class="sidebar-role" id="sidebar-urole">Software Developer</div>
        </div>
        <a href="https://www.linkedin.com/in/nihaldharpure/" target="_blank" class="sidebar-linkedin" onclick="e=>e.stopPropagation()" title="Open LinkedIn">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
            <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
          </svg>
        </a>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <div class="nav-section-label">Main</div>

        <div class="nav-item" data-page="onboarding" onclick="window._navigate('onboarding')">
          <span class="nav-icon">${userIcon()}</span>
          <span>Profile Setup</span>
        </div>

        <div class="nav-item" data-page="jobs" onclick="window._navigate('jobs')">
          <span class="nav-icon">${searchIcon()}</span>
          <span>Find Jobs</span>
        </div>

        <div class="nav-section-label" style="margin-top:8px">Track</div>

        <div class="nav-item" data-page="dashboard" onclick="window._navigate('dashboard')">
          <span class="nav-icon">${chartIcon()}</span>
          <span>Dashboard</span>
          <span class="nav-badge" id="nav-app-count">0</span>
        </div>

        <div class="nav-section-label" style="margin-top:8px">Config</div>

        <div class="nav-item" data-page="settings" onclick="window._navigate('settings')">
          <span class="nav-icon">${settingsIcon()}</span>
          <span>Settings</span>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="app-status">
          <div class="status-dot"></div>
          <span>System Ready</span>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="main-content">
      <!-- Top bar -->
      <header class="topbar">
        <div class="topbar-left">
          <div class="breadcrumb">AutoApply / <span id="breadcrumb-page">Setup</span></div>
        </div>
        <div class="topbar-right">
          <div class="topbar-stat">
            Applied: <strong id="topbar-count">0</strong>
          </div>
          <div class="topbar-btn" onclick="window._navigate('jobs')" title="Search Jobs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <div class="topbar-btn" onclick="window._navigate('settings')" title="Settings">
            ${settingsIcon(16)}
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="page-content" id="page-content"></main>
    </div>
  `;
}

// ── Router ────────────────────────────────────────────────────
function navigate(page) {
  currentPage = page;

  // Update active nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Breadcrumb
  const labels = {
    onboarding: 'Profile Setup',
    jobs:       'Find Jobs',
    dashboard:  'Dashboard',
    settings:   'Settings',
  };
  const bc = document.getElementById('breadcrumb-page');
  if (bc) bc.textContent = labels[page] || page;

  // Update stats
  updateShellStats();

  // Render page
  const content = document.getElementById('page-content');
  if (!content) return;

  content.innerHTML = '';
  content.scrollTop = 0;

  switch (page) {
    case 'onboarding':
      renderOnboarding(content, navigate);
      break;
    case 'jobs':
      renderJobSearch(content);
      break;
    case 'dashboard':
      renderDashboard(content);
      break;
    case 'settings':
      renderSettings(content);
      break;
    default:
      content.innerHTML = '<p style="padding:40px;color:var(--text-muted)">Page not found</p>';
  }
}

// Expose globally
window._navigate = navigate;

// ── Update Shell Stats ─────────────────────────────────────────
function updateShellStats() {
  const apps = Storage.getApplications();
  const count = apps.length;

  const topbarCount = document.getElementById('topbar-count');
  const navCount    = document.getElementById('nav-app-count');
  const avatar      = document.getElementById('sidebar-avatar');
  const uname       = document.getElementById('sidebar-uname');
  const urole       = document.getElementById('sidebar-urole');

  if (topbarCount) topbarCount.textContent = count;
  if (navCount)    navCount.textContent    = count;

  // Update profile mini card
  const profile = Storage.getProfile();
  if (profile && avatar) {
    const initials = (profile.name || 'ND').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    avatar.textContent  = initials;
    if (uname) uname.textContent = profile.name  || 'Nihal Dharpure';
    if (urole) urole.textContent = profile.title || 'Software Developer';
  }
}

// ── Icon Helpers ──────────────────────────────────────────────
function userIcon(size = 18) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="${size}" height="${size}">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>`;
}
function searchIcon(size = 18) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="${size}" height="${size}">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>`;
}
function chartIcon(size = 18) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="${size}" height="${size}">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><path d="M2 20h20"/>
  </svg>`;
}
function settingsIcon(size = 18) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="${size}" height="${size}">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>`;
}
