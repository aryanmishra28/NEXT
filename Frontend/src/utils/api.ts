const API_BASE_URL = 'http://localhost:5000/api';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  message: string;
  user?: AuthUser;
}

async function parseJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (err) {
      // JSON parse failed — try to return text for better error message
      const text = await response.clone().text();
      throw new Error(`Server returned invalid JSON (${response.status}): ${text.substring(0, 200)}`);
    }
  } else {
    const text = await response.text();
    throw new Error(`Server error (${response.status}): ${text || 'Unknown error'}`);
  }
}

export const registerUser = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include', // Important for cookies
    });

    const data = await parseJsonResponse(response);

    if (!response.ok || !data.success) {
      throw new Error(data.message || `Registration failed (${response.status})`);
    }
    return data;
  } catch (error: any) {
    if (error instanceof Error) throw error;
    throw new Error(error.message || 'Network error: Could not connect to server. Please check if the backend is running.');
  }
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Important for cookies
    });

    const data = await parseJsonResponse(response);

    if (!response.ok || !data.success) {
      throw new Error(data.message || `Login failed (${response.status})`);
    }
    return data;
  } catch (error: any) {
    if (error instanceof Error) throw error;
    throw new Error(error.message || 'Network error: Could not connect to server. Please check if the backend is running.');
  }
};

// Google Sign-in API
export const googleSignIn = async (idToken: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // allow backend to set httpOnly cookies
      body: JSON.stringify({ idToken }), // ✅ FIXED
    });

    const data = await parseJsonResponse(response);

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Google sign-in failed');
    }

    return data;
  } catch (error: any) {
    throw new Error(
      error?.message ||
        'Network error: Could not connect to server. Please check if backend is running.'
    );
  }
};


// AnalyzeResume API
export const analyzeResume = async (file: File) => {
  const form = new FormData();
  form.append('resume', file);

  const response = await fetch(`${API_BASE_URL}/resume/analyze`, {
    method: 'POST',
    body: form,
    credentials: 'include' // if auth protected
  });

  // defensive parse like other helpers
  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) data = await response.json();
  else {
    const txt = await response.text();
    throw new Error(`Server error (${response.status}): ${txt || 'Unknown'}`);
  }

  if (!response.ok) {
    throw new Error(data.message || `Resume analysis failed (${response.status})`);
  }

  return data;
};


// Hackathon Ideas API
export const generateHackathonIdeas = async (interest: string, category: string, skillLevel: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/hackathon/generate-ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interest, category, skillLevel }),
      credentials: 'include', // include cookies if endpoint needs auth
    });

    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.message || 'Failed to generate hackathon ideas');
    }
    return data;
  } catch (error: any) {
    if (error instanceof Error) throw error;
    throw new Error(error.message || 'Network error: Could not connect to server. Please check if the backend is running.');
  }
};

// Fetch Hackathons API
export interface Hackathon {
  id: string;
  title: string;
  description?: string;
  date: string;
  startDate: string;
  endDate: string;
  location: string;
  isVirtual: boolean;
  participants: string;
  participantsCount?: number;
  prize: string;
  prizeAmount?: number;
  difficulty: string;
  tags: string[];
  registrationLink: string;
  deadline?: string;
  organizer?: string;
  image?: string;
  status: string;
}

export interface HackathonsResponse {
  success: boolean;
  hackathons: Hackathon[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
  message?: string;
}

export const fetchHackathons = async (status?: string, limit?: number, page?: number): Promise<HackathonsResponse> => {
  try {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (page) params.append('page', page.toString());

    const queryString = params.toString();
    const url = `${API_BASE_URL}/hackathon/list${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // include cookies if endpoint needs auth
    });

    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch hackathons');
    }
    return data;
  } catch (error: any) {
    if (error instanceof Error) throw error;
    throw new Error(error.message || 'Network error: Could not connect to server. Please check if the backend is running.');
  }
};

export const fetchJobs = async () => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE}/api/jobs`
  );
  return res.json();
};

export const applyJob = async (jobId: string) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE}/api/applications/apply`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    }
  );
  return res.json();
};

export const postJob = async (jobData: any) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE}/api/jobs`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobData),
    }
  );
  return res.json();
};
