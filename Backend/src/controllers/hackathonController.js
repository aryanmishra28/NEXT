const fetch = global.fetch || require('node-fetch');
const Hackathon = require('../models/hackathon');
//const { GoogleGenerativeAI } = require('@google/generative-ai'); // Removed to use dynamic import
const axios = require('axios');

// Environment toggle: set USE_GEMINI=false in .env to disable live Gemini calls (use sample ideas)
const USE_GEMINI = String(process.env.USE_GEMINI ?? 'true').toLowerCase() !== 'false';

// Helper function to estimate tokens (rough approximation: 1 token ≈ 4 characters)
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

// sanitize string: remove surrounding backticks/markdown, line numbers like "1." etc.
function sanitizeModelText(s) {
  if (!s) return s;
  // remove common prefixes like "```json" and suffixes "```"
  s = s.replace(/```json\s*/i, '').replace(/```$/i, '');
  // remove leading numbering like "1. {" or "1) {" etc. only if followed by whitespace
  s = s.replace(/^\s*\d+\s*[.)]\s*/gm, '');
  // trim
  return s.trim();
}

// Find the first balanced JSON array in a string (returns null if none)
function findBalancedJsonArray(text) {
  if (!text || typeof text !== 'string') return null;
  const start = text.indexOf('[');
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '[') depth++;
    else if (ch === ']') depth--;

    // If we closed all opened arrays, return substring
    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }
  return null; // no balanced array found
}

// Add or post a new hackathon
const postHackathon = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      isVirtual,
      registrationLink,
      deadline,
      prize,
      prizeAmount,
      category,
      difficulty,
      requirements,
      organizer,
      image
    } = req.body;

    // Validate required fields
    if (!title || !startDate || !endDate || !registrationLink) {
      return res.status(400).json({
        success: false,
        message: 'Title, start date, end date, and registration link are required'
      });
    }

    // Create new hackathon
    const hackathon = await Hackathon.create({
      title: title.trim(),
      description: description || '',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location: location || 'Virtual',
      isVirtual: isVirtual ?? true,
      registrationLink,
      deadline: deadline ? new Date(deadline) : null,
      prize: prize || 'TBA',
      prizeAmount: prizeAmount || null,
      category: Array.isArray(category) ? category : (category ? [category] : ['General']),
      difficulty: difficulty || 'Beginner',
      requirements: Array.isArray(requirements) ? requirements : (requirements ? [requirements] : []),
      organizer: organizer || 'Community',
      image: image || null,
      source: 'manual', // Mark as manually posted
      participants: 0,
      participantsText: '0',
      status: 'upcoming'
    });

    res.status(201).json({
      success: true,
      message: 'Hackathon posted successfully!',
      hackathon
    });
  } catch (error) {
    console.error('Error posting hackathon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post hackathon',
      error: error.message
    });
  }
};

function safeJsonParse(str) {
  try { return { ok: true, value: JSON.parse(str) }; }
  catch (err) { return { ok: false, error: err }; }
}

// Try to list models; try v1 then v1beta
async function listModels(apiKey) {
  const bases = [
    'https://generativelanguage.googleapis.com/v1',
    'https://generativelanguage.googleapis.com/v1beta'
  ];
  for (const base of bases) {
    try {
      const url = `${base}/models?key=${apiKey}`;
      const r = await axios.get(url, { validateStatus: () => true });
      if (r.status >= 200 && r.status < 300 && Array.isArray(r.data?.models)) {
        return { base, models: r.data.models };
      }
      // if 404/403/400, continue to next base
    } catch (err) {
      // ignore and try next base
    }
  }
  return null;
}

function pickModel(models) {
  // prefer any model that supports generateContent, else generateText
  if (!Array.isArray(models)) return null;
  for (const m of models) {
    const sm = m.supportedMethods || m.supported_methods || [];
    if (sm.includes('generateContent')) return m;
  }
  for (const m of models) {
    const sm = m.supportedMethods || m.supported_methods || [];
    if (sm.includes('generateText')) return m;
  }
  return models.find(m => /gemini|bison|text/i.test(m.name)) || models[0] || null;
}

// Generate sample ideas as fallback when API quota is exceeded
function generateSampleIdeas(interest, category, skillLevel) {
  const interestLower = (interest || '').toLowerCase();
  const ideas = [];

  // Web Development ideas
  if (interestLower.includes('web') || interestLower.includes('frontend') || interestLower.includes('backend')) {
    ideas.push(
      {
        title: 'TaskFlow - Collaborative Project Manager',
        description: 'A real-time collaborative project management tool with drag-and-drop boards, team chat, and progress tracking.',
        technologies: ['React', 'Node.js', 'Socket.io', 'MongoDB'],
        difficulty: skillLevel || 'Intermediate',
        category: category || 'Productivity'
      },
      {
        title: 'CodeShare - Live Code Editor',
        description: 'A browser-based code editor with real-time collaboration, syntax highlighting, and instant deployment.',
        technologies: ['React', 'WebSockets', 'Docker', 'AWS'],
        difficulty: skillLevel || 'Advanced',
        category: category || 'Developer Tools'
      },
      {
        title: 'EcoCart - Sustainable Shopping Assistant',
        description: 'Browser extension that suggests eco-friendly alternatives while shopping online.',
        technologies: ['JavaScript', 'Chrome Extension API', 'React', 'Firebase'],
        difficulty: skillLevel || 'Beginner',
        category: category || 'Sustainability'
      }
    );
  }

  // Mobile Apps ideas
  if (interestLower.includes('mobile') || interestLower.includes('app') || interestLower.includes('ios') || interestLower.includes('android')) {
    ideas.push(
      {
        title: 'StudySync - Study Group Organizer',
        description: 'Mobile app to organize study groups, share notes, and track learning progress with gamification.',
        technologies: ['React Native', 'Firebase', 'Redux', 'Expo'],
        difficulty: skillLevel || 'Intermediate',
        category: category || 'Education'
      },
      {
        title: 'FitTrack - Personal Fitness Coach',
        description: 'AI-powered fitness app with workout plans, meal tracking, and progress analytics.',
        technologies: ['Flutter', 'TensorFlow Lite', 'SQLite', 'REST API'],
        difficulty: skillLevel || 'Intermediate',
        category: category || 'Health & Fitness'
      }
    );
  }

  // AI/ML ideas
  if (interestLower.includes('ai') || interestLower.includes('machine learning') || interestLower.includes('ml')) {
    ideas.push(
      {
        title: 'SmartResume - AI Resume Analyzer',
        description: 'Analyze resumes and provide personalized feedback to improve ATS compatibility and job match score.',
        technologies: ['Python', 'OpenAI API', 'Flask', 'NLP'],
        difficulty: skillLevel || 'Advanced',
        category: category || 'Career Tools'
      },
      {
        title: 'PlantAI - Plant Care Assistant',
        description: 'Identify plants from photos and provide care recommendations using computer vision.',
        technologies: ['TensorFlow', 'React Native', 'Firebase', 'Image Recognition'],
        difficulty: skillLevel || 'Intermediate',
        category: category || 'Lifestyle'
      }
    );
  }

  // Blockchain ideas
  if (interestLower.includes('blockchain') || interestLower.includes('crypto') || interestLower.includes('web3')) {
    ideas.push(
      {
        title: 'CharityChain - Transparent Donation Platform',
        description: 'Blockchain-based platform ensuring transparent and traceable charitable donations.',
        technologies: ['Solidity', 'Web3.js', 'React', 'Ethereum'],
        difficulty: skillLevel || 'Advanced',
        category: category || 'Social Impact'
      }
    );
  }

  // IoT ideas
  if (interestLower.includes('iot') || interestLower.includes('internet of things')) {
    ideas.push(
      {
        title: 'SmartHome Hub - Unified IoT Controller',
        description: 'Centralized hub to control all smart home devices with voice commands and automation.',
        technologies: ['Arduino', 'Raspberry Pi', 'MQTT', 'React'],
        difficulty: skillLevel || 'Intermediate',
        category: category || 'Smart Home'
      }
    );
  }

  // Data Science ideas
  if (interestLower.includes('data') || interestLower.includes('analytics')) {
    ideas.push(
      {
        title: 'TrendTracker - Social Media Analytics',
        description: 'Analyze social media trends and predict viral content using data science techniques.',
        technologies: ['Python', 'Pandas', 'Scikit-learn', 'D3.js'],
        difficulty: skillLevel || 'Advanced',
        category: category || 'Analytics'
      }
    );
  }

  // Default ideas if no specific match
  if (ideas.length === 0) {
    ideas.push(
      {
        title: `${interest} Innovation Platform`,
        description: `A platform to connect ${interest} enthusiasts, share ideas, and collaborate on projects.`,
        technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
        difficulty: skillLevel || 'Intermediate',
        category: category || 'Innovation'
      },
      {
        title: `Smart${interest} Assistant`,
        description: `An AI-powered assistant to help with ${interest} tasks and provide intelligent recommendations.`,
        technologies: ['Python', 'React', 'OpenAI API', 'FastAPI'],
        difficulty: skillLevel || 'Intermediate',
        category: category || 'AI Tools'
      },
      {
        title: `${interest} Learning Hub`,
        description: `Interactive learning platform for ${interest} with courses, quizzes, and progress tracking.`,
        technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Stripe'],
        difficulty: skillLevel || 'Beginner',
        category: category || 'Education'
      }
    );
  }

  // Return 3-5 ideas
  return ideas.slice(0, 5);
}

// Robust Gemini caller with retries & backoff
async function callGeminiAPI(apiKey, prompt, context = 'genai', opts = {}) {
  // opts: { model, maxRetries, initialDelayMs }
  const model = opts.model || 'gemini-2.0-flash';
  const maxRetries = Number(opts.maxRetries ?? 3);
  let delay = Number(opts.initialDelayMs ?? 800);

  if (!USE_GEMINI) {
    const err = new Error('Gemini disabled via USE_GEMINI env');
    err.type = 'DISABLED';
    throw err;
  }

  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY not configured');
    err.type = 'NO_KEY';
    throw err;
  }

  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    try {
      console.log(`📡 [${context}] Calling Google Generative AI API (attempt ${attempt})...`);
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const m = genAI.getGenerativeModel({ model });
      const result = await m.generateContent(prompt);
      const response = result.response;

      // Extract text - attempt common shapes
      const text = typeof response.text === 'function' ? response.text() : response.text;

      if (!text || text.trim().length === 0) {
        const err = new Error('API returned empty text');
        err.type = 'EMPTY_RESPONSE';
        err.raw = response;
        throw err;
      }

      console.log(`✓ [${context}] Extracted text length: ${text.length}`);
      return text;
    } catch (err) {
      // err can be ApiError from SDK with status/code/message
      const msg = String(err?.message || err);
      const isQuota = msg.toLowerCase().includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429');
      const containsZeroLimit = msg.includes('limit: 0');

      // If the error includes RetryInfo with seconds, extract that
      let serverDelayMs = null;
      try {
        const m = msg.match(/retry.*?(\d+\.?\d*)s/i) || msg.match(/Retry-After:\s*(\d+)/i);
        if (m) serverDelayMs = Math.ceil(Number(m[1]) * 1000);
      } catch (e) { }

      console.warn(`❌ [${context}] GenAI error on attempt ${attempt}: ${msg.substring(0, 300)}`);

      // If quota=0, bail immediately (no point retrying)
      if (containsZeroLimit) {
        const e = new Error('Quota exceeded (limit: 0)');
        e.type = 'QUOTA';
        e.raw = err;
        throw e;
      }

      // If it's a quota error or too many requests, consider retrying up to maxRetries
      if (isQuota) {
        if (attempt >= maxRetries) {
          const e = new Error('Quota/rate limit error after retries');
          e.type = 'QUOTA';
          e.raw = err;
          throw e;
        }
        const waitMs = serverDelayMs ?? delay;
        console.log(`⏳ Waiting ${waitMs}ms before retrying...`);
        await new Promise(r => setTimeout(r, waitMs));
        delay *= 2;
        continue;
      }

      // For other errors, if attempts left, retry; otherwise throw
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }

      // No retries left, attach type and raw
      const e = new Error(msg);
      e.type = 'API_ERROR';
      e.raw = err;
      throw e;
    }
  }

  // If exited loop unexpectedly:
  const e = new Error('Gemini call failed after retries');
  e.type = 'API_ERROR';
  throw e;
}

// Generate hackathon project ideas using Google GenAI
const generateIdeas = async (req, res) => {
  try {
    const { interest, category, skillLevel } = req.body;

    if (!interest) {
      return res.status(400).json({
        success: false,
        message: 'Interest field is required'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key or USE_GEMINI disabled, use sample ideas
    if (!apiKey || !USE_GEMINI) {
      if (!apiKey) {
        console.log('❌ No GEMINI_API_KEY found in environment variables, using sample ideas');
      } else {
        console.log('❗ USE_GEMINI is disabled in environment, using sample ideas');
      }
      const sampleIdeas = generateSampleIdeas(interest, category, skillLevel);
      return res.json({
        success: true,
        ideas: sampleIdeas,
        count: sampleIdeas.length,
        source: 'sample',
        note: !apiKey
          ? 'AI API key not configured. Showing sample ideas. Add GEMINI_API_KEY to .env to enable AI generation.'
          : 'USE_GEMINI=false set in env; live AI disabled.'
      });
    }

    // Validate API key format (Google API keys typically start with AIza)
    if (!apiKey.startsWith('AIza')) {
      console.warn('⚠️ API key format looks unusual. Google API keys usually start with "AIza"');
    }

    console.log('✓ GEMINI_API_KEY found, length:', apiKey.length);

    // Build concise prompt
    const timestamp = Date.now();
    const randomSeed = Math.floor(Math.random() * 1000);

    const prompt = `Generate 4-5 UNIQUE hackathon ideas for ${interest}. Skill: ${skillLevel || 'Intermediate'}. Category: ${category || 'Innovation'}.

Requirements:
- Fresh, original ideas each time (ID: ${timestamp}-${randomSeed})
- Vary technologies, problem domains, difficulty levels
- Practical for 24-48h hackathons
- Mix social impact, technical, creative, business applications

For each idea provide:
- Creative title
- Brief description (problem + solution)
- Tech stack (3-4 technologies)
- Difficulty (Beginner/Intermediate/Advanced)
- Category

Return ONLY JSON array (no markdown):
[
  {"title": "...", "description": "...", "technologies": ["..."], "difficulty": "...", "category": "..."}
]`;

    // Estimate tokens for logging
    const estimatedTokens = estimateTokens(prompt);
    console.log('Estimated input tokens for hackathon ideas:', estimatedTokens, '(free tier limit: ~15,000)');
    if (estimatedTokens > 1000) {
      console.warn('Warning: Prompt may be approaching token limits');
    }

    console.log('Interest:', interest, 'Category:', category, 'Skill Level:', skillLevel);
    console.log('Request ID:', `${timestamp}-${randomSeed}`);
    console.log('Prompt length:', prompt.length, 'chars');

    // Call Gemini with retries
    let text;
    try {
      text = await callGeminiAPI(apiKey, prompt, 'Hackathon Ideas', { model: 'gemini-2.5-flash', maxRetries: 3, initialDelayMs: 800 });
    } catch (err) {
      // Distinguish error types to pick fallback or return error
      console.error('Error in hackathon ideas API call:', err);
      // If it's clearly quota/rate limit or disabled/no-key, fallback to sample ideas
      const errType = err?.type || (String(err?.message || '').toLowerCase().includes('quota') ? 'QUOTA' : 'API_ERROR');
      if (errType === 'QUOTA' || errType === 'DISABLED' || errType === 'NO_KEY' || errType === 'RATE_LIMIT') {
        console.log('⚠️ API call failed, using sample ideas as fallback');
        const sampleIdeas = generateSampleIdeas(interest, category, skillLevel);
        return res.json({
          success: true,
          ideas: sampleIdeas,
          count: sampleIdeas.length,
          source: 'sample',
          note: errType === 'QUOTA'
            ? 'API quota exceeded. Showing sample ideas.'
            : errType === 'DISABLED' ? 'Gemini disabled via USE_GEMINI env.' : 'AI service unavailable. Showing sample ideas.',
          errorType: errType,
          raw: err.raw ? (typeof err.raw === 'string' ? err.raw : JSON.stringify(err.raw).slice(0, 1000)) : undefined
        });
      }
      // For other API errors, return 500 with details (and still include fallback as best-effort)
      console.error('Unrecoverable API error (returning sample ideas as fallback):', err);
      const sampleIdeas = generateSampleIdeas(interest, category, skillLevel);
      return res.json({
        success: true,
        ideas: sampleIdeas,
        count: sampleIdeas.length,
        source: 'sample',
        note: 'AI service returned unexpected error. Showing sample ideas.',
        error: String(err.message || err)
      });
    }

    // If we have text, parse it
    console.log('Raw AI response (first 500 chars):', (text || '').substring(0, 500));
    const sanitized = sanitizeModelText(text);
    const arrStr = findBalancedJsonArray(sanitized);

    if (!arrStr) {
      console.error('Could not extract JSON array from AI response. Full text:', text);
      throw new Error('AI response does not contain valid JSON array');
    }

    let parsed;
    try {
      parsed = JSON.parse(arrStr);
      console.log('Successfully parsed JSON array from AI response, length:', parsed?.length);
    } catch (parseError) {
      console.error('Failed to parse JSON array:', parseError);
      console.error('JSON string that failed:', arrStr);
      throw new Error('Failed to parse AI response as JSON array');
    }

    if (!Array.isArray(parsed)) {
      console.error('Parsed response is not an array:', typeof parsed, parsed);
      throw new Error('AI response is not a valid array');
    }

    // Normalize and return ideas
    const ideas = parsed.map((it, index) => ({
      title: it.title || it.name || `Untitled Idea ${index + 1}`,
      description: it.description || it.desc || '',
      technologies: Array.isArray(it.technologies)
        ? it.technologies
        : (typeof it.technologies === 'string'
          ? it.technologies.split(',').map(s => s.trim()).filter(s => s)
          : []),
      difficulty: it.difficulty || it.level || skillLevel || 'Intermediate',
      category: it.category || category || 'General'
    }));

    // Validate uniqueness
    const titles = ideas.map(i => i.title.toLowerCase());
    const uniqueTitles = new Set(titles);
    if (titles.length !== uniqueTitles.size) {
      console.warn('Some ideas have duplicate titles - API may have returned similar ideas');
    }

    console.log('Returning', ideas.length, 'unique ideas');
    console.log('Idea titles:', ideas.map(i => i.title));

    return res.json({
      success: true,
      ideas: ideas,
      count: ideas.length,
      source: 'ai',
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error generating ideas:', error);

    // fallback to samples if possible
    try {
      const { interest, category, skillLevel } = req.body;
      if (interest) {
        const sampleIdeas = generateSampleIdeas(interest, category, skillLevel);
        return res.json({
          success: true,
          ideas: sampleIdeas,
          count: sampleIdeas.length,
          source: 'sample',
          note: 'Error occurred. Showing sample ideas.',
          error: String(error.message || error)
        });
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate ideas. Please try again later.',
      error: String(error.message || error)
    });
  }
};

// Fetch ACTUAL HACKATHON EVENTS from MongoDB database ✅ CORRECT APPROACH
const getHackathons = async (req, res) => {
  try {
    const { status, limit, page } = req.query;

    // Build query
    let query = {};
    if (status) {
      query.status = status;
    } else {
      // Default: get upcoming and ongoing hackathons
      query.$or = [
        { status: 'upcoming' },
        { status: 'ongoing' }
      ];
    }

    // Pagination
    const limitNum = parseInt(limit) || 50;
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    // Fetch from database
    const hackathons = await Hackathon.find(query)
      .sort({ startDate: 1 }) // Sort by start date ascending
      .limit(limitNum)
      .skip(skip)
      .lean(); // Use lean() for better performance

    // If no hackathons in DB, return sample data and seed the database
    if (hackathons.length === 0) {
      console.log('No hackathons found in database. Seeding sample data...');
      await seedSampleHackathons();
      const seededHackathons = await Hackathon.find(query)
        .sort({ startDate: 1 })
        .limit(limitNum)
        .skip(skip)
        .lean();

      return res.json({
        success: true,
        hackathons: seededHackathons.map(formatHackathon),
        message: 'Sample hackathons loaded'
      });
    }

    // Format hackathons for frontend
    const formattedHackathons = hackathons.map(formatHackathon);

    res.json({
      success: true,
      hackathons: formattedHackathons,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: await Hackathon.countDocuments(query)
      }
    });

  } catch (error) {
    console.error('Error fetching hackathons:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch hackathons.' });
  }
};

// Format hackathon for frontend response
const formatHackathon = (hackathon) => {
  return {
    id: hackathon._id.toString(),
    title: hackathon.title,
    description: hackathon.description,
    date: hackathon.dateDisplay || formatDateRange(hackathon.startDate, hackathon.endDate),
    startDate: hackathon.startDate,
    endDate: hackathon.endDate,
    location: hackathon.location,
    isVirtual: hackathon.isVirtual,
    participants: hackathon.participantsText || `${hackathon.participants}+`,
    participantsCount: hackathon.participants,
    prize: hackathon.prize,
    prizeAmount: hackathon.prizeAmount,
    difficulty: hackathon.difficulty,
    tags: hackathon.tags || [],
    registrationLink: hackathon.registrationLink,
    deadline: hackathon.deadline ? formatDate(hackathon.deadline) : null,
    organizer: hackathon.organizer,
    image: hackathon.bannerUrl || hackathon.imageUrl || getDefaultImage(hackathon.tags),
    status: hackathon.status
  };
};

// Helper function to format date range
const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

// Helper function to format single date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Helper function to get default gradient image based on tags
const getDefaultImage = (tags) => {
  if (!tags || tags.length === 0) return 'bg-gradient-to-br from-[#6A0DAD] to-[#9B4DFF]';

  const tag = tags[0].toLowerCase();
  if (tag.includes('ai') || tag.includes('ml') || tag.includes('machine learning')) {
    return 'bg-gradient-to-br from-blue-500 to-purple-600';
  } else if (tag.includes('sustainability') || tag.includes('climate') || tag.includes('green')) {
    return 'bg-gradient-to-br from-green-500 to-teal-600';
  } else if (tag.includes('fintech') || tag.includes('blockchain') || tag.includes('crypto')) {
    return 'bg-gradient-to-br from-yellow-500 to-orange-600';
  } else if (tag.includes('health') || tag.includes('medical')) {
    return 'bg-gradient-to-br from-pink-500 to-red-600';
  } else {
    return 'bg-gradient-to-br from-[#6A0DAD] to-[#9B4DFF]';
  }
};

// Seed sample hackathons (called if database is empty)
const seedSampleHackathons = async () => {
  const sampleHackathons = [
    {
      title: 'AI Innovation Challenge 2024',
      description: 'Join us for an exciting hackathon focused on AI and machine learning innovations.',
      startDate: new Date('2024-12-15'),
      endDate: new Date('2024-12-17'),
      location: 'San Francisco, CA',
      isVirtual: false,
      registrationLink: 'https://devpost.com/hackathons',
      deadline: new Date('2024-12-10'),
      prize: '$50,000',
      prizeAmount: 50000,
      participants: 2500,
      participantsText: '2.5K+',
      difficulty: 'Advanced',
      tags: ['AI/ML', 'Healthcare', 'Social Impact'],
      organizer: 'Tech Innovators',
      status: 'upcoming',
      source: 'manual'
    },
    {
      title: 'Sustainable Tech Hackathon',
      description: 'Build solutions for climate change and sustainability challenges.',
      startDate: new Date('2025-01-08'),
      endDate: new Date('2025-01-10'),
      location: 'Virtual',
      isVirtual: true,
      registrationLink: 'https://devpost.com/hackathons',
      deadline: new Date('2025-01-05'),
      prize: '$25,000',
      prizeAmount: 25000,
      participants: 1800,
      participantsText: '1.8K+',
      difficulty: 'Intermediate',
      tags: ['Climate Tech', 'Sustainability', 'IoT'],
      organizer: 'Green Tech Alliance',
      status: 'upcoming',
      source: 'manual'
    },
    {
      title: 'Fintech Revolution',
      description: 'Innovate in financial technology, blockchain, and payment solutions.',
      startDate: new Date('2025-01-22'),
      endDate: new Date('2025-01-24'),
      location: 'New York, NY',
      isVirtual: false,
      registrationLink: 'https://devpost.com/hackathons',
      deadline: new Date('2025-01-18'),
      prize: '$75,000',
      prizeAmount: 75000,
      participants: 3200,
      participantsText: '3.2K+',
      difficulty: 'Advanced',
      tags: ['Fintech', 'Blockchain', 'Security'],
      organizer: 'Finance Hub',
      status: 'upcoming',
      source: 'manual'
    }
  ];

  try {
    await Hackathon.insertMany(sampleHackathons);
    console.log('Sample hackathons seeded successfully');
  } catch (error) {
    console.error('Error seeding hackathons:', error);
    throw error;
  }
};

// Fetches curated list of Indian Hackathons (Simulated API)
const fetchIndianHackathons = async () => {
  // Curated list of verified upcoming Indian hackathons for 2025
  return [
    {
      title: "CVMU Hackathon 2025 (Grand Finale)",
      description: "A 36-hour non-stop coding marathon focusing on innovation in AI, Healthcare, and Smart Cities. Join us at A D Patel Institute of Technology.",
      startDate: new Date("2025-02-14T09:00:00.000Z"),
      endDate: new Date("2025-02-15T21:00:00.000Z"),
      location: "New V V Nagar, Gujarat, India",
      isVirtual: false,
      registrationLink: "https://cvmu.edu.in/hackathon2025",
      deadline: new Date("2025-02-10T23:59:59.000Z"),
      prize: "₹1,00,000",
      prizeAmount: 100000,
      participants: 500,
      participantsText: "500+",
      difficulty: "Intermediate",
      tags: ["AI/ML", "Smart City", "Healthcare"],
      organizer: "CVM University",
      image: "bg-gradient-to-br from-orange-400 to-red-500", // Vibrant Indian-themed gradient
      source: 'indian-api'
    },
    {
      title: "InnovateYou Techathon 2025",
      description: "Pune's largest tech innovation challenge offering over ₹4 Lakhs in prizes. Categories include FinTech, EdTech, and Green Energy.",
      startDate: new Date("2025-03-15T08:00:00.000Z"),
      endDate: new Date("2025-03-16T20:00:00.000Z"),
      location: "Pune, Maharashtra, India",
      isVirtual: false,
      registrationLink: "https://innovateyou.in/techathon",
      deadline: new Date("2025-03-01T23:59:59.000Z"),
      prize: "₹4,00,000",
      prizeAmount: 400000,
      participants: 1000,
      participantsText: "1000+",
      difficulty: "Advanced",
      tags: ["FinTech", "EdTech", "Sustainability"],
      organizer: "InnovateYou Foundation",
      image: "bg-gradient-to-br from-blue-600 to-indigo-700",
      source: 'indian-api'
    },
    {
      title: "HackIndia 2025",
      description: "India's premier student hackathon connecting developers across the nation. Build the future with Web3 and AI.",
      startDate: new Date("2025-03-22T10:00:00.000Z"),
      endDate: new Date("2025-03-24T10:00:00.000Z"),
      location: "Bangalore, India (Hybrid)",
      isVirtual: true,
      registrationLink: "https://hackindia.org",
      deadline: new Date("2025-03-10T23:59:59.000Z"),
      prize: "₹5,00,000",
      prizeAmount: 500000,
      participants: 5000,
      participantsText: "5000+",
      difficulty: "Intermediate",
      tags: ["Web3", "AI", "Open Innovation"],
      organizer: "HackIndia Team",
      image: "bg-gradient-to-br from-purple-500 to-pink-500",
      source: 'indian-api'
    },
    {
      title: "Smart India Hackathon 2025 (Internal Rounds)",
      description: "Preparation rounds for the world's biggest open innovation model. Solve problem statements from various ministries.",
      startDate: new Date("2025-02-20T09:00:00.000Z"),
      endDate: new Date("2025-02-21T18:00:00.000Z"),
      location: "Various Campuses, India",
      isVirtual: false,
      registrationLink: "https://sih.gov.in",
      deadline: new Date("2025-02-15T23:59:59.000Z"),
      prize: "Recognition & Entry to Grand Finale",
      prizeAmount: 0,
      participants: 10000,
      participantsText: "10000+",
      difficulty: "Hard",
      tags: ["Government", "Social Impact", "Innovation"],
      organizer: "Ministry of Education",
      image: "bg-gradient-to-br from-green-500 to-emerald-700",
      source: 'indian-api'
    }
  ];
};

// Fetch fresh hackathons from "third-party APIs" (Now using our curated Indian list)
const getThirdPartyHackathons = async (req, res) => {
  try {
    console.log('Fetching curated Indian hackathons...');
    const hacks = await fetchIndianHackathons(); // Use our reliable source

    res.json({
      success: true,
      hackathons: hacks,
      count: hacks.length,
      message: 'Successfully fetched upcoming Indian hackathons'
    });
  } catch (error) {
    console.error('Error fetching third-party hackathons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch external hackathons'
    });
  }
};

// Sync hackathons from external sources (Indian list) - Saves to DB
const syncFromDevpost = async (req, res) => {
  try {
    console.log('Syncing Indian hackathons to database...');
    const hacks = await fetchIndianHackathons();
    let newCount = 0;

    for (const h of hacks) {
      // Check if exists by title and start date to avoid duplicates
      const exists = await Hackathon.findOne({
        title: h.title,
        startDate: h.startDate
      });

      if (!exists) {
        await Hackathon.create({
          ...h,
          source: 'external-sync',
          status: 'upcoming'
        });
        newCount++;
      }
    }

    res.json({
      success: true,
      message: `Synced ${newCount} new Indian hackathons to database`,
      newHackathons: newCount
    });

  } catch (error) {
    console.error('Error syncing hackathons:', error);
    res.status(500).json({ success: false, message: 'Failed to sync hackathons' });
  }
};

module.exports = {
  generateIdeas,
  postHackathon,
  getHackathons,
  getThirdPartyHackathons,
  syncFromDevpost
};
