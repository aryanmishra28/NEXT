// controllers/resumeController.js
const { GoogleGenAI } = require('@google/genai');

// Try to load pdf-parse (best-effort). If it doesn't expose a direct callable, we fallback to pdfjs-dist
let pdfParseCallable = null;
try {
  const _pdfParse = require('pdf-parse');
  // If module itself is a function, use it.
  if (typeof _pdfParse === 'function') {
    pdfParseCallable = async (buffer) => await _pdfParse(buffer);
    console.log('✅ pdf-parse: using direct function export');
  } else if (_pdfParse && typeof _pdfParse.default === 'function') {
    pdfParseCallable = async (buffer) => await _pdfParse.default(buffer);
    console.log('✅ pdf-parse: using default function export');
  } else if (_pdfParse && typeof _pdfParse.parse === 'function') {
    pdfParseCallable = async (buffer) => await _pdfParse.parse(buffer);
    console.log('✅ pdf-parse: using parse() export');
  } else {
    // Not a callable shape we can rely on
    console.warn('⚠️ pdf-parse loaded but no callable export detected; will use pdfjs-dist fallback if available.');
    pdfParseCallable = null;
  }
} catch (err) {
  console.warn('pdf-parse not usable or not installed:', err?.message || err);
  pdfParseCallable = null;
}

// pdfjs fallback: lazy-load when needed
let pdfjsLib = null;
async function extractTextWithPdfjs(buffer) {
  // lazy require so app boots without pdfjs-dist if not needed
  if (!pdfjsLib) {
    try {
      // Use the legacy Node build which works reliably in Node environments
      pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
      // For Node, ensure path resolution for worker is not needed (we use node build)
      // no worker setup needed for legacy build
      console.log('✅ pdfjs-dist loaded as fallback parser');
    } catch (err) {
      console.error('❌ pdfjs-dist is not installed or failed to load. Install with: npm i pdfjs-dist', err?.message || err);
      throw new Error('pdfjs-dist not available');
    }
  }

  // pdfjs expects typed array or ArrayBuffer
  const typed = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  const loadingTask = pdfjsLib.getDocument({ data: typed });
  const doc = await loadingTask.promise;

  let fullText = '';
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items.map(i => i.str || '').join(' ');
    fullText += pageText + '\n\n';
  }
  // close document
  if (doc && typeof doc.cleanup === 'function') {
    try { doc.cleanup(); } catch (e) {}
  }
  return { text: fullText };
}

/** Minimal token estimator (approx 1 token ≈ 4 characters) */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/** Helper: call Gemini and extract textual output (handles a few SDK shapes) */
async function callGeminiAPI(apiKey, prompt, context = '') {
  try {
    console.log(`📡 [${context}] Calling Google GenAI API...`);
    const genAI = new GoogleGenAI({ apiKey });

    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt
    });

    console.log(`✓ [${context}] API call returned`);

    if (!response) throw new Error('Empty response from Gemini');

    if (response.text) {
      return typeof response.text === 'function' ? response.text() : response.text;
    }

    if (Array.isArray(response?.candidates) && response.candidates[0]?.content?.parts?.[0]?.text) {
      return response.candidates[0].content.parts[0].text;
    }

    // last-resort stringify
    return JSON.stringify(response);
  } catch (err) {
    console.error(`❌ [${context}] Gemini API error:`, err?.message || err);
    throw err;
  }
}

/** Find balanced JSON object in text (first { ... } match) */
function findJsonObject(text) {
  if (!text || typeof text !== 'string') return null;
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (depth === 0) return text.slice(start, i + 1);
  }
  return null;
}

/** sanitize simple code fences & trimming */
function sanitizeText(s) {
  if (!s) return s;
  return s.replace(/```json/gi, '').replace(/```/g, '').trim();
}

/** Local fallback analysis */
function generateSampleAnalysis(resumeText = '') {
  return {
    ats_score: 60,
    detected_job_titles: ['Software Engineer'],
    top_skills: { technical: ['JavaScript', 'Node.js'], soft: ['Communication'], tools: ['Git'] },
    missing_keywords: ['REST API', 'Unit Testing'],
    experience_summary: 'Candidate has basic software engineering experience. Add measurable achievements.',
    improvement_suggestions: [
      'Add metrics to achievements (e.g. reduced latency by 30%).',
      'List tools and frameworks used for each project.',
      'Highlight most recent experience at top.'
    ],
    achievement_rewrite_examples: [
      'Before: Worked on backend features.\nAfter: Implemented REST endpoints in Node.js, improving response times by 25%.'
    ],
    grammar_issues: [],
    section_completeness: {
      contact: 'present', summary: 'weak', experience: 'present', projects: 'weak', skills: 'present', education: 'present', certifications: 'missing'
    }
  };
}

/** MAIN controller */
const analyzeResume = async (req, res) => {
  try {
    // 1) Validate file
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a PDF resume (field name: 'resume')." });
    }
    console.log('📄 Received file:', req.file.originalname, 'size:', req.file.size);

    // 2) Extract text using pdf-parse if available, else pdfjs-dist
    let parsed = null;
    if (pdfParseCallable) {
      try {
        parsed = await pdfParseCallable(req.file.buffer);
        console.log('✅ Parsed PDF with pdf-parse');
      } catch (err) {
        console.warn('pdf-parse failed at runtime:', err?.message || err);
        parsed = null;
      }
    }

    if (!parsed) {
      // try pdfjs fallback
      try {
        parsed = await extractTextWithPdfjs(req.file.buffer);
        console.log('✅ Parsed PDF with pdfjs-dist fallback');
      } catch (err) {
        console.error('PDF parse error (both parsers failed):', err?.message || err);
        return res.status(500).json({
          success: false,
          message: 'Server PDF parser not available or failed to extract text. Install/pdf-parse/pdfjs-dist and restart.'
        });
      }
    }

    const resumeText = parsed && parsed.text ? parsed.text.trim() : '';
    if (!resumeText) {
      return res.status(400).json({ success: false, message: 'Could not extract text from PDF. Upload a text-based PDF resume.' });
    }

    // 3) Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('No GEMINI_API_KEY configured — returning sample analysis');
      const sample = generateSampleAnalysis(resumeText);
      return res.json({ success: true, data: sample, source: 'sample' });
    }

    // 4) Build ATS-style prompt (token-limited)
    const MAX_PREVIEW_CHARS = 4000;
    const preview = resumeText.length > MAX_PREVIEW_CHARS ? resumeText.substring(0, MAX_PREVIEW_CHARS) : resumeText;

    const prompt = `
You are an ATS (Applicant Tracking System) resume evaluator. Analyze the resume text and return ONLY valid JSON (no explanation).

RESUME:
${preview}

Return JSON with these keys:
{
  "ats_score": number (1-100),
  "detected_job_titles": [string],
  "top_skills": { "technical": [string], "soft": [string], "tools": [string] },
  "missing_keywords": [string],
  "experience_summary": string,
  "improvement_suggestions": [string],
  "achievement_rewrite_examples": [string],
  "grammar_issues": [string],
  "section_completeness": { "contact":"present|weak|missing", "summary":"present|weak|missing", "experience":"present|weak|missing", "projects":"present|weak|missing", "skills":"present|weak|missing", "education":"present|weak|missing", "certifications":"present|weak|missing" }
}

Rules:
- Keep arrays small and actionable (3-7 items where applicable).
- achievement_rewrite_examples should include 1-3 bullet rewrites using metrics.
- Do NOT add commentary or markdown outside the JSON.
`;

    console.log('Prompt length (chars):', prompt.length, 'Estimated tokens:', estimateTokens(prompt));

    // 5) Call Gemini
    let aiText;
    try {
      aiText = await callGeminiAPI(apiKey, prompt, 'Resume-ATS');
    } catch (err) {
      console.error('Gemini call failed:', err?.message || err);
      const sample = generateSampleAnalysis(resumeText);
      return res.json({ success: true, data: sample, source: 'sample', note: 'AI service unavailable (fallback used)' });
    }

    // 6) Extract JSON from AI response
    const cleaned = sanitizeText(String(aiText));
    const jsonStr = findJsonObject(cleaned);
    if (!jsonStr) {
      console.error('AI returned unexpected format (no JSON). Response preview:', cleaned.slice(0, 800));
      const sample = generateSampleAnalysis(resumeText);
      return res.json({ success: true, data: sample, source: 'sample', note: 'AI returned unexpected format (fallback used)' });
    }

    // 7) Parse JSON
    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonStr);
    } catch (err) {
      console.error('Failed to parse AI JSON:', err?.message || err, 'jsonStr preview:', jsonStr.slice(0, 500));
      const sample = generateSampleAnalysis(resumeText);
      return res.json({ success: true, data: sample, source: 'sample', note: 'Failed to parse AI JSON (fallback used)' });
    }

    // 8) Normalize fields
    const normalized = {
      ats_score: typeof parsedJson.ats_score === 'number' ? Math.max(0, Math.min(100, parsedJson.ats_score)) : 60,
      detected_job_titles: Array.isArray(parsedJson.detected_job_titles) ? parsedJson.detected_job_titles : [],
      top_skills: {
        technical: Array.isArray(parsedJson.top_skills?.technical) ? parsedJson.top_skills.technical : [],
        soft: Array.isArray(parsedJson.top_skills?.soft) ? parsedJson.top_skills.soft : [],
        tools: Array.isArray(parsedJson.top_skills?.tools) ? parsedJson.top_skills.tools : []
      },
      missing_keywords: Array.isArray(parsedJson.missing_keywords) ? parsedJson.missing_keywords : [],
      experience_summary: typeof parsedJson.experience_summary === 'string' ? parsedJson.experience_summary : '',
      improvement_suggestions: Array.isArray(parsedJson.improvement_suggestions) ? parsedJson.improvement_suggestions : [],
      achievement_rewrite_examples: Array.isArray(parsedJson.achievement_rewrite_examples) ? parsedJson.achievement_rewrite_examples : [],
      grammar_issues: Array.isArray(parsedJson.grammar_issues) ? parsedJson.grammar_issues : [],
      section_completeness: (parsedJson.section_completeness && typeof parsedJson.section_completeness === 'object') ? {
        contact: parsedJson.section_completeness.contact || 'missing',
        summary: parsedJson.section_completeness.summary || 'missing',
        experience: parsedJson.section_completeness.experience || 'missing',
        projects: parsedJson.section_completeness.projects || 'missing',
        skills: parsedJson.section_completeness.skills || 'missing',
        education: parsedJson.section_completeness.education || 'missing',
        certifications: parsedJson.section_completeness.certifications || 'missing'
      } : { contact: 'missing', summary: 'missing', experience: 'missing', projects: 'missing', skills: 'missing', education: 'missing', certifications: 'missing' }
    };

    // 9) Return normalized to frontend
    return res.json({ success: true, data: normalized, source: 'ai', timestamp: Date.now() });

  } catch (err) {
    console.error('Unexpected error in analyzeResume:', err?.message || err);
    const sample = generateSampleAnalysis('');
    return res.status(500).json({ success: true, data: sample, source: 'sample', note: 'Unexpected server error, returned sample analysis' });
  }
};

module.exports = { analyzeResume };
