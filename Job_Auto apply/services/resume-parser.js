// ============================================================
// Resume Parser Service
// Supports PDF (via PDF.js) and DOCX (via Mammoth.js)
// ============================================================

const SKILL_KEYWORDS = [
  // Languages
  'javascript','typescript','python','java','c++','c#','go','rust','kotlin','swift',
  'php','ruby','scala','r','matlab','dart','html','css','sql',
  // Frameworks
  'react','angular','vue','next.js','nuxt','svelte','node.js','express','django',
  'flask','spring','laravel','rails','fastapi','graphql','rest','grpc',
  // Cloud & DevOps
  'aws','azure','gcp','docker','kubernetes','terraform','ansible','jenkins',
  'ci/cd','github actions','linux','nginx','redis','rabbitmq','kafka',
  // Data & AI
  'machine learning','deep learning','tensorflow','pytorch','pandas','numpy',
  'scikit-learn','spark','hadoop','tableau','power bi','excel','sql server',
  'postgresql','mysql','mongodb','firebase','elasticsearch',
  // Tools
  'git','jira','figma','postman','swagger','vs code','intellij','xcode',
  // Soft skills
  'agile','scrum','leadership','communication','problem solving','teamwork',
];

/**
 * Parse a File object (PDF or DOCX) and extract resume data.
 * @param {File} file
 * @returns {Promise<Object>} Parsed resume data
 */
export async function parseResume(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  let rawText = '';
  if (ext === 'pdf') {
    rawText = await extractPDFText(file);
  } else if (ext === 'docx' || ext === 'doc') {
    rawText = await extractDOCXText(file);
  } else if (ext === 'txt') {
    rawText = await file.text();
  } else {
    throw new Error(`Unsupported file type: .${ext}`);
  }

  return extractStructuredData(rawText, file.name);
}

// ── PDF Extraction ────────────────────────────────────────────────────────────
async function extractPDFText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target.result);
        const pdf        = await window.pdfjsLib.getDocument({ data: typedArray }).promise;
        let fullText     = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page    = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }
        resolve(fullText);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ── DOCX Extraction ───────────────────────────────────────────────────────────
async function extractDOCXText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = await window.mammoth.extractRawText({ arrayBuffer: e.target.result });
        resolve(result.value);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ── Structured Data Extraction ────────────────────────────────────────────────
function extractStructuredData(text, fileName) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  return {
    rawText:    text,
    fileName:   fileName,
    name:       extractName(lines),
    email:      extractEmail(text),
    phone:      extractPhone(text),
    location:   extractLocation(text),
    linkedin:   extractLinkedIn(text),
    title:      extractTitle(lines),
    skills:     extractSkills(text),
    experience: extractExperience(lines),
    education:  extractEducation(lines),
    summary:    extractSummary(lines),
    parsedAt:   new Date().toISOString(),
  };
}

function extractName(lines) {
  // Usually the first non-empty line that looks like a name
  for (const line of lines.slice(0, 5)) {
    if (/^[A-Za-z\s]{3,40}$/.test(line) && !isKeyword(line)) {
      return toTitleCase(line.trim());
    }
  }
  return 'Your Name';
}

function extractEmail(text) {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : '';
}

function extractPhone(text) {
  const match = text.match(/[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/);
  return match ? match[0] : '';
}

function extractLocation(text) {
  const match = text.match(/([A-Za-z\s]+,\s*[A-Za-z\s]+)/);
  return match ? match[0].trim() : '';
}

function extractLinkedIn(text) {
  const match = text.match(/linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/i);
  return match ? 'https://www.' + match[0] : 'https://www.linkedin.com/in/nihaldharpure/';
}

function extractTitle(lines) {
  const titleKeywords = ['engineer','developer','designer','analyst','manager','lead',
    'architect','consultant','specialist','scientist','intern','fresher'];
  for (const line of lines.slice(0, 10)) {
    const lower = line.toLowerCase();
    if (titleKeywords.some(k => lower.includes(k)) && line.length < 80) {
      return line;
    }
  }
  return 'Software Professional';
}

function extractSkills(text) {
  const lower = text.toLowerCase();
  return SKILL_KEYWORDS.filter(skill => lower.includes(skill))
    .map(s => toTitleCase(s));
}

function extractExperience(lines) {
  const expKeywords = ['experience','work history','employment','professional'];
  const eduKeywords = ['education','academic','qualification','degree'];
  const experiences = [];

  let inExp = false;
  let current = null;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (expKeywords.some(k => lower.includes(k))) { inExp = true; continue; }
    if (eduKeywords.some(k => lower.includes(k))) { inExp = false; }

    if (inExp) {
      const yearMatch = line.match(/\b(19|20)\d{2}\b/);
      if (yearMatch && line.length < 100) {
        if (current) experiences.push(current);
        current = { title: line, period: '', description: [] };
      } else if (current) {
        current.description.push(line);
      }
    }
  }
  if (current) experiences.push(current);

  return experiences.slice(0, 5);
}

function extractEducation(lines) {
  const eduKeywords = ['education','university','college','bachelor','master','b.tech',
    'm.tech','b.e','m.e','mba','phd','degree','diploma'];
  const education = [];

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (eduKeywords.some(k => lower.includes(k)) && lines[i].length < 120) {
      education.push({
        degree:      lines[i],
        institution: lines[i + 1] || '',
        year:        (lines[i].match(/\b(19|20)\d{2}\b/) || [''])[0],
      });
    }
  }
  return education.slice(0, 3);
}

function extractSummary(lines) {
  const summaryKeywords = ['summary','objective','about','profile','overview'];
  for (let i = 0; i < lines.length; i++) {
    if (summaryKeywords.some(k => lines[i].toLowerCase().includes(k))) {
      const next = lines.slice(i + 1, i + 4).join(' ');
      if (next.length > 20) return next;
    }
  }
  return '';
}

function isKeyword(word) {
  const kw = ['summary','experience','education','skills','projects','contact','references','work'];
  return kw.includes(word.toLowerCase());
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Calculate match score between resume skills and job description
 * @param {string[]} resumeSkills
 * @param {string} jobDescription
 * @returns {number} 0-100
 */
export function calculateMatchScore(resumeSkills, jobDescription) {
  if (!resumeSkills?.length || !jobDescription) return Math.floor(Math.random() * 30) + 50;
  const lowerDesc = jobDescription.toLowerCase();
  const matched   = resumeSkills.filter(skill => lowerDesc.includes(skill.toLowerCase()));
  const base      = Math.min(100, Math.round((matched.length / Math.max(resumeSkills.length, 1)) * 100));
  return Math.max(base, 40); // Minimum 40%
}
