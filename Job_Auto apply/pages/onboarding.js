// ============================================================
// Onboarding Page — Profile Setup + Resume Upload
// ============================================================

import { Storage }    from '../services/storage.js';
import { parseResume } from '../services/resume-parser.js';

export function renderOnboarding(container, onComplete) {
  container.innerHTML = `
    <div class="onboard-wrapper">
      <div class="onboard-hero">
        <div class="onboard-badge"><span class="pulse-dot"></span> Auto Apply AI</div>
        <h1 class="onboard-title">Let's Set Up Your Profile</h1>
        <p class="onboard-sub">Upload your resume and we'll extract everything automatically — then we'll find and apply to the best matching jobs.</p>
      </div>

      <div class="onboard-steps">
        <!-- Step 1: Resume Upload -->
        <div class="step-card active" id="step-1">
          <div class="step-header">
            <div class="step-num">01</div>
            <div>
              <h2 class="step-title">Upload Your Resume</h2>
              <p class="step-desc">PDF or DOCX — our AI extracts your skills, experience, and more</p>
            </div>
          </div>

          <div class="upload-zone" id="upload-zone">
            <input type="file" id="resume-file" accept=".pdf,.doc,.docx,.txt" hidden />
            <div class="upload-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 16v-8m0 0-3 3m3-3 3 3M20 16.5A3.5 3.5 0 0 0 16.5 13H15a5 5 0 1 0-9.9 1M4 17.5a3.5 3.5 0 0 0 3.5 3.5h9"/>
              </svg>
            </div>
            <p class="upload-main">Drop your resume here</p>
            <p class="upload-sub">or <button class="link-btn" onclick="document.getElementById('resume-file').click()">browse files</button></p>
            <p class="upload-formats">PDF, DOCX, TXT supported</p>
          </div>

          <div class="parse-status" id="parse-status" style="display:none">
            <div class="parse-spinner"></div>
            <span>Parsing your resume...</span>
          </div>
          <div class="parse-success" id="parse-success" style="display:none">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>
            <span>Resume parsed successfully!</span>
          </div>
        </div>

        <!-- Step 2: LinkedIn Profile -->
        <div class="step-card" id="step-2">
          <div class="step-header">
            <div class="step-num">02</div>
            <div>
              <h2 class="step-title">LinkedIn Profile</h2>
              <p class="step-desc">Add your LinkedIn URL to enhance your profile</p>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">LinkedIn Profile URL</label>
            <input type="url" class="form-input" id="linkedin-url" 
              placeholder="https://www.linkedin.com/in/nihaldharpure/"
              value="https://www.linkedin.com/in/nihaldharpure/" />
          </div>
        </div>

        <!-- Step 3: Profile Preview & Edit -->
        <div class="step-card" id="step-3">
          <div class="step-header">
            <div class="step-num">03</div>
            <div>
              <h2 class="step-title">Review Your Profile</h2>
              <p class="step-desc">Confirm your extracted details — edit anything below</p>
            </div>
          </div>
          <div class="profile-preview" id="profile-preview">
            <div class="preview-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              <p>Upload your resume to preview extracted profile</p>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="onboard-cta">
          <button class="btn btn-primary btn-lg" id="start-btn" onclick="window._startApplying()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            Start Finding Jobs
          </button>
          <button class="btn btn-ghost" id="skip-btn" onclick="window._skipOnboard()">Skip Setup →</button>
        </div>
      </div>
    </div>
  `;

  initUploadZone(onComplete);
}

function initUploadZone(onComplete) {
  const zone        = document.getElementById('upload-zone');
  const fileInput   = document.getElementById('resume-file');
  const parseStatus = document.getElementById('parse-status');
  const parseSuccess= document.getElementById('parse-success');
  const step2       = document.getElementById('step-2');
  const step3       = document.getElementById('step-3');

  // Existing profile?
  const existing = Storage.getResume();
  if (existing) {
    showProfilePreview(existing);
    step2.classList.add('active');
    step3.classList.add('active');
  }

  // Drag & Drop
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleFile(e.dataTransfer.files[0]);
  });
  zone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

  async function handleFile(file) {
    if (!file) return;
    zone.classList.add('parsing');
    parseStatus.style.display = 'flex';
    parseSuccess.style.display = 'none';

    try {
      const data = await parseResume(file);
      Storage.saveResume(data);

      // Pre-fill profile from resume
      const profile = Storage.getProfile() || {};
      const merged  = {
        ...profile,
        name:        data.name,
        email:       data.email,
        phone:       data.phone,
        location:    data.location || 'India',
        title:       data.title,
        skills:      data.skills,
        linkedin:    document.getElementById('linkedin-url')?.value || data.linkedin,
        resumeFile:  file.name,
        summary:     data.summary,
      };
      Storage.saveProfile(merged);

      parseStatus.style.display = 'none';
      parseSuccess.style.display = 'flex';
      zone.classList.remove('parsing');

      showProfilePreview(data);
      step2.classList.add('active');
      step3.classList.add('active');

      // Update zone to show file name
      zone.querySelector('.upload-main').textContent = `✓ ${file.name}`;
      zone.querySelector('.upload-sub').innerHTML   = '<span style="color:var(--success)">Resume loaded</span>';
    } catch (err) {
      parseStatus.style.display = 'none';
      zone.classList.remove('parsing');
      zone.querySelector('.upload-main').textContent = '❌ Parse failed — try another file';
      console.error('Resume parse error:', err);
    }
  }

  // Global handlers
  window._startApplying = () => {
    // Save LinkedIn URL
    const linkedin  = document.getElementById('linkedin-url')?.value || '';
    const profile   = Storage.getProfile() || {};
    Storage.saveProfile({ ...profile, linkedin });
    onComplete('jobs');
  };

  window._skipOnboard = () => {
    // Create default profile for Nihal
    const defaultProfile = {
      name:     'Nihal Dharpure',
      email:    '',
      phone:    '',
      location: 'India',
      title:    'Software Developer',
      skills:   ['JavaScript', 'React', 'Node.js', 'Python', 'HTML', 'CSS', 'Git'],
      linkedin: 'https://www.linkedin.com/in/nihaldharpure/',
      summary:  '',
    };
    if (!Storage.getProfile()) Storage.saveProfile(defaultProfile);
    onComplete('jobs');
  };
}

function showProfilePreview(data) {
  const preview = document.getElementById('profile-preview');
  if (!preview) return;

  const skills = (data.skills || []).slice(0, 12);
  preview.innerHTML = `
    <div class="profile-card-inner">
      <div class="profile-avatar">
        <div class="avatar-initials">${getInitials(data.name || 'ND')}</div>
      </div>
      <div class="profile-info">
        <h3 class="profile-name">${data.name || 'Nihal Dharpure'}</h3>
        <p class="profile-title">${data.title || 'Software Professional'}</p>
        <div class="profile-meta">
          ${data.email ? `<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg> ${data.email}</span>` : ''}
          ${data.phone ? `<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> ${data.phone}</span>` : ''}
        </div>
        <div class="skills-preview">
          ${skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
          ${data.skills?.length > 12 ? `<span class="skill-tag skill-more">+${data.skills.length - 12} more</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

function getInitials(name) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}
