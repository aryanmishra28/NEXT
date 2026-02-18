import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Sparkles,
  Calendar,
  Users,
  Trophy,
  Clock,
  MapPin,
  ExternalLink,
  Zap,
  RefreshCw,
  Star,
  Code,
  Rocket,
  AlertCircle,
  Plus,
  Send,
  X
} from 'lucide-react';
import { fetchHackathons, postHackathon, fetchThirdPartyHackathons, syncHackathonsFromThirdParty, type Hackathon } from '../utils/api';
import { useAuth } from './AuthContext';

type GeneratedIdea = {
  title: string;
  description: string;
  technologies?: string[];
  difficulty?: string;
  category?: string;
};


export function HackathonIdeas() {
  const { user } = useAuth();
  const [selectedSkill, setSelectedSkill] = useState('');
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [featuredHackathons, setFeaturedHackathons] = useState<Hackathon[]>([]);
  const [isLoadingHackathons, setIsLoadingHackathons] = useState(true);
  const [hackathonsError, setHackathonsError] = useState<string | null>(null);

  // Hackathon posting state
  const [showPostForm, setShowPostForm] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postingError, setPostingError] = useState<string | null>(null);
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    prizeMoney: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    categories: '',
    difficulty: 'Beginner',
    tags: '',
    location: '',
    requirements: '',
    website: '',
    contact: ''
  });
  const [postLoading, setPostLoading] = useState(false);
  const [hackathonForm, setHackathonForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: 'Virtual',
    isVirtual: true,
    registrationLink: '',
    deadline: '',
    prize: '',
    prizeAmount: '',
    category: 'General',
    difficulty: 'Beginner',
    requirements: '',
    organizer: '',
    image: ''
  });

  const skills = [
    'Web Development', 'Mobile Apps', 'AI/ML', 'Blockchain',
    'IoT', 'AR/VR', 'Data Science', 'Cybersecurity', 'Game Development'
  ];

  // Fetch hackathons from API on component mount
  useEffect(() => {
    const loadHackathons = async () => {
      setIsLoadingHackathons(true);
      setHackathonsError(null);
      try {
        const response = await fetchHackathons('upcoming', 10, 1);
        if (response.success && response.hackathons) {
          // Convert image string to proper format for display
          const formattedHackathons = response.hackathons.map(hackathon => ({
            ...hackathon,
            image: typeof hackathon.image === 'string' && hackathon.image.startsWith('bg-gradient')
              ? hackathon.image
              : `bg-gradient-to-br from-[#6A0DAD] to-[#9B4DFF]`
          }));
          setFeaturedHackathons(formattedHackathons);
        }
      } catch (error) {
        console.error('Error fetching hackathons:', error);
        setHackathonsError(error instanceof Error ? error.message : 'Failed to load hackathons');
        // Keep empty array, will show error message
      } finally {
        setIsLoadingHackathons(false);
      }
    };

    loadHackathons();
  }, []);

  const projectIdeas = [
    {
      title: 'EcoTrack - Carbon Footprint Monitor',
      description: 'AI-powered app that tracks daily activities and suggests eco-friendly alternatives',
      difficulty: 'Intermediate',
      tech: ['React Native', 'Python', 'TensorFlow'],
      category: 'Sustainability'
    },
    {
      title: 'StudyBuddy - AI Learning Assistant',
      description: 'Personalized learning platform with AI tutoring and progress tracking',
      difficulty: 'Advanced',
      tech: ['Next.js', 'OpenAI API', 'PostgreSQL'],
      category: 'Education'
    },
    {
      title: 'HealthGuard - Medication Reminder',
      description: 'Smart medication management with IoT sensors and mobile alerts',
      difficulty: 'Beginner',
      tech: ['Flutter', 'Arduino', 'Firebase'],
      category: 'Healthcare'
    }
  ];

  // replace generateIdeas in Frontend/src/components/HackathonIdeas.tsx
  const generateIdeas = async () => {
    if (!selectedSkill) return;
    setIsGenerating(true);
    try {
      const res = await fetch('http://localhost:5000/api/hackathon/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interest: selectedSkill,
          category: 'Innovation',
          skillLevel: 'Intermediate'
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Server error:', res.status, text);
        alert('Failed to generate ideas. Check server logs.');
        return;
      }

      const data = await res.json();

      // Case A: Backend returned structured array at data.ideas
      if (Array.isArray(data.ideas)) {
        // Normalize each idea to our GeneratedIdea shape
        const normalized = data.ideas.map((it: any) => ({
          title: it.title || it.name || 'Untitled Idea',
          description: it.description || it.desc || '',
          technologies: Array.isArray(it.technologies) ? it.technologies : (typeof it.technologies === 'string' ? it.technologies.split(',').map((s: string) => s.trim()) : []),
          difficulty: it.difficulty || it.level || 'Intermediate',
          category: it.category || 'General'
        }));
        setGeneratedIdeas(normalized);
        return;
      }

      // Case B: Backend returned ideas_raw (string). Try to extract JSON substring and parse.
      const raw = data.ideas_raw ?? data.ideas ?? JSON.stringify(data);
      const extracted = extractJsonArray(raw);
      if (extracted) {
        try {
          const parsed = JSON.parse(extracted);
          if (Array.isArray(parsed)) {
            const normalized = parsed.map((it: any) => ({
              title: it.title || it.name || 'Untitled Idea',
              description: it.description || it.desc || '',
              technologies: Array.isArray(it.technologies) ? it.technologies : (typeof it.technologies === 'string' ? it.technologies.split(',').map((s: string) => s.trim()) : []),
              difficulty: it.difficulty || it.level || 'Intermediate',
              category: it.category || 'General'
            }));
            setGeneratedIdeas(normalized);
            return;
          }
        } catch (e) {
          console.warn('JSON parse failed on extracted substring', e);
        }
      }

      // Final fallback: show raw text as a single card
      setGeneratedIdeas([{
        title: 'AI Output (raw)',
        description: typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2),
        technologies: [],
        difficulty: 'Intermediate',
        category: 'AI'
      }]);

    } catch (err) {
      console.error('Network / unexpected error:', err);
      alert('Network error while generating ideas.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper: find first JSON array in text and return it as string (or null)
  function extractJsonArray(text: string): string | null {
    if (!text || typeof text !== 'string') return null;
    const first = text.indexOf('[');
    const last = text.lastIndexOf(']');
    if (first === -1 || last === -1 || last <= first) return null;
    // Return the substring that looks like a JSON array
    return text.slice(first, last + 1);
  }


  const getDifficultyColor = (difficulty: string | undefined) => {
    if (!difficulty) return 'bg-gray-100 text-gray-800';
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      case 'expert': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostLoading(true);

    try {
      await postHackathon({
        title: postForm.title,
        description: postForm.description,
        registrationLink: postForm.website,
        deadline: postForm.registrationDeadline,
        prize: postForm.prizeMoney,
        prizeAmount: parseInt(postForm.prizeMoney.replace(/[^0-9]/g, '')) || 0,
        categories: postForm.categories.split(',').map(cat => cat.trim()),
        difficulty: postForm.difficulty,
        tags: postForm.tags.split(',').map(tag => tag.trim()),
        location: postForm.location,
        requirements: postForm.requirements.split(',').map(req => req.trim()),
        organizer: postForm.contact,
      });

      alert('Hackathon posted successfully!');
      setShowPostForm(false);
      setPostForm({
        title: '',
        description: '',
        prizeMoney: '',
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        categories: '',
        difficulty: 'Beginner',
        tags: '',
        location: '',
        requirements: '',
        website: '',
        contact: ''
      });

      // Refresh the hackathons list
      setIsLoadingHackathons(true);
      try {
        const response = await fetchHackathons('upcoming', 10, 1);
        if (response.success && response.hackathons) {
          const formattedHackathons = response.hackathons.map(hackathon => ({
            ...hackathon,
            image: typeof hackathon.image === 'string' && hackathon.image.startsWith('bg-gradient')
              ? hackathon.image
              : `bg-gradient-to-br from-[#6A0DAD] to-[#9B4DFF]`
          }));
          setFeaturedHackathons(formattedHackathons);
        }
      } catch (refreshError) {
        console.error('Error refreshing hackathons:', refreshError);
      } finally {
        setIsLoadingHackathons(false);
      }
    } catch (error) {
      console.error('Error posting hackathon:', error);
      alert('Failed to post hackathon. Please try again.');
    } finally {
      setPostLoading(false);
    }
  };

  const resetPostForm = () => {
    setPostForm({
      title: '',
      description: '',
      prizeMoney: '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      categories: '',
      difficulty: 'Beginner',
      tags: '',
      location: '',
      requirements: '',
      website: '',
      contact: ''
    });
  };

  const handleFetchThirdPartyHackathons = async () => {
    setIsLoadingHackathons(true);
    setHackathonsError(null);

    try {
      const response = await fetchThirdPartyHackathons();
      if (response.success && response.hackathons) {
        const formattedHackathons = response.hackathons.map(hackathon => ({
          ...hackathon,
          image: typeof hackathon.image === 'string' && hackathon.image.startsWith('bg-gradient')
            ? hackathon.image
            : `bg-gradient-to-br from-[#6A0DAD] to-[#9B4DFF]`
        }));
        setFeaturedHackathons(formattedHackathons);
        alert(`Loaded ${response.hackathons.length} hackathons from third-party sources!`);
      }
    } catch (error) {
      console.error('Error fetching third-party hackathons:', error);
      setHackathonsError(error instanceof Error ? error.message : 'Failed to load third-party hackathons');
    } finally {
      setIsLoadingHackathons(false);
    }
  };

  const handleSyncThirdPartyHackathons = async () => {
    setIsLoadingHackathons(true);
    setHackathonsError(null);

    try {
      const response = await syncHackathonsFromThirdParty();
      if (response.success) {
        alert(`Successfully synced ${response.newHackathons || 0} new hackathons to database!`);
        // Refresh local hackathons list after sync
        const refreshResponse = await fetchHackathons('upcoming', 10, 1);
        if (refreshResponse.success && refreshResponse.hackathons) {
          const formattedHackathons = refreshResponse.hackathons.map(hackathon => ({
            ...hackathon,
            image: typeof hackathon.image === 'string' && hackathon.image.startsWith('bg-gradient')
              ? hackathon.image
              : `bg-gradient-to-br from-[#6A0DAD] to-[#9B4DFF]`
          }));
          setFeaturedHackathons(formattedHackathons);
        }
      }
    } catch (error) {
      console.error('Error syncing third-party hackathons:', error);
      setHackathonsError(error instanceof Error ? error.message : 'Failed to sync third-party hackathons');
    } finally {
      setIsLoadingHackathons(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#6A0DAD] via-[#8B5FBF] to-[#9B4DFF] py-16">
        <div className="max-w-7xl mx-auto px-6 text-center text-white">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Lightbulb size={40} className="text-yellow-300" />
            <h1 className="text-4xl md:text-5xl font-bold">Hackathon Hub</h1>
          </div>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Discover exciting hackathons and get AI-powered project ideas to kickstart your innovation journey
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* AI Idea Generator */}
        <section className="mb-12">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Sparkles className="text-[#6A0DAD]" size={28} />
                <h2 className="text-2xl font-bold text-gray-900">AI Project Idea Generator</h2>
              </div>
              <p className="text-gray-600">Get personalized hackathon project ideas based on your skills</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What's your main skill or interest?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {skills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => setSelectedSkill(skill)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${selectedSkill === skill
                          ? 'border-[#6A0DAD] bg-[#6A0DAD]/5 text-[#6A0DAD]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateIdeas}
                disabled={!selectedSkill || isGenerating}
                className="w-full bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] text-white py-4 rounded-xl font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    <span>Generating Ideas...</span>
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    <span>Generate Project Ideas</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Ideas */}
            {generatedIdeas.length > 0 && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedIdeas.map((idea, index) => (
                  <div key={index} className="p-6 bg-gradient-to-br from-[#6A0DAD]/5 to-[#9B4DFF]/5 rounded-2xl border border-[#6A0DAD]/20">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{idea.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(idea.difficulty)}`}>
                        {idea.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{idea.description}</p>
                    <div className="space-y-2">
                      {idea.technologies && idea.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {idea.technologies.map((tech, techIndex) => (
                            <span key={techIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6A0DAD] font-medium">{idea.category}</span>
                        <button
                          className="text-[#6A0DAD] hover:text-[#9B4DFF] transition-colors"
                          aria-label="Favorite"
                          title="Favorite"
                        >
                          <Star size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Post New Hackathon Section */}
        {user && (
          <section className="mb-12">
            <div className="bg-gradient-to-br from-[#6A0DAD]/10 to-[#9B4DFF]/10 rounded-3xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Post a New Hackathon</h2>
                <p className="text-gray-600">Share your hackathon with the community</p>
              </div>

              {!showPostForm ? (
                <div className="text-center">
                  <button
                    onClick={() => setShowPostForm(true)}
                    className="bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] text-white py-3 px-8 rounded-xl font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2 mx-auto"
                  >
                    <Plus size={20} />
                    <span>Post Hackathon</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePostSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                      <input
                        type="text"
                        required
                        value={postForm.title}
                        onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A0DAD] focus:border-transparent"
                        placeholder="Enter hackathon title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prize Money</label>
                      <input
                        type="text"
                        value={postForm.prizeMoney}
                        onChange={(e) => setPostForm({ ...postForm, prizeMoney: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A0DAD] focus:border-transparent"
                        placeholder="e.g., $10,000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      required
                      rows={4}
                      value={postForm.description}
                      onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A0DAD] focus:border-transparent"
                      placeholder="Describe your hackathon..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                      <input
                        type="datetime-local"
                        required
                        value={postForm.startDate}
                        onChange={(e) => setPostForm({ ...postForm, startDate: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A0DAD] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                      <input
                        type="datetime-local"
                        required
                        value={postForm.endDate}
                        onChange={(e) => setPostForm({ ...postForm, endDate: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A0DAD] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Registration Deadline</label>
                      <input
                        type="datetime-local"
                        value={postForm.registrationDeadline}
                        onChange={(e) => setPostForm({ ...postForm, registrationDeadline: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A0DAD] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={postForm.location}
                        onChange={(e) => setPostForm({ ...postForm, location: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A0DAD] focus:border-transparent"
                        placeholder="Online, City Name, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                      <select
                        value={postForm.difficulty}
                        onChange={(e) => setPostForm({ ...postForm, difficulty: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A0DAD] focus:border-transparent"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categories (comma-separated)</label>
                      <input
                        type="text"
                        value={postForm.categories}
                        onChange={(e) => setPostForm({ ...postForm, categories: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A0DAD] focus:border-transparent"
                        placeholder="Web Development, AI/ML, Mobile"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={postForm.tags}
                        onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A0DAD] focus:border-transparent"
                        placeholder="JavaScript, React, Node.js"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Requirements (comma-separated)</label>
                    <input
                      type="text"
                      value={postForm.requirements}
                      onChange={(e) => setPostForm({ ...postForm, requirements: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A0DAD] focus:border-transparent"
                      placeholder="Student ID, Portfolio, Team of 3-5"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                      <input
                        type="url"
                        value={postForm.website}
                        onChange={(e) => setPostForm({ ...postForm, website: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A0DAD] focus:border-transparent"
                        placeholder="https://hackathon-website.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                      <input
                        type="email"
                        value={postForm.contact}
                        onChange={(e) => setPostForm({ ...postForm, contact: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A0DAD] focus:border-transparent"
                        placeholder="contact@hackathon.com"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={postLoading}
                      className="flex-1 bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {postLoading ? (
                        <>
                          <RefreshCw className="animate-spin" size={20} />
                          <span>Posting...</span>
                        </>
                      ) : (
                        <>
                          <Send size={20} />
                          <span>Post Hackathon</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowPostForm(false);
                        resetPostForm();
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        )}

        {/* Featured Hackathons */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Hackathons</h2>
            {!isLoadingHackathons && (
              <div className="flex space-x-3">
                <button
                  onClick={handleFetchThirdPartyHackathons}
                  className="flex items-center space-x-2 text-[#6A0DAD] hover:text-[#9B4DFF] transition-colors bg-[#6A0DAD]/10 hover:bg-[#6A0DAD]/20 px-3 py-2 rounded-lg"
                  disabled={isLoadingHackathons}
                >
                  <ExternalLink size={16} />
                  <span className="text-sm font-medium">Load from APIs</span>
                </button>
                <button
                  onClick={handleSyncThirdPartyHackathons}
                  className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg"
                  disabled={isLoadingHackathons}
                >
                  <Plus size={16} />
                  <span className="text-sm font-medium">Sync to DB</span>
                </button>
                <button
                  onClick={async () => {
                    setIsLoadingHackathons(true);
                    setHackathonsError(null);
                    try {
                      const response = await fetchHackathons('upcoming', 10, 1);
                      if (response.success && response.hackathons) {
                        const formattedHackathons = response.hackathons.map(hackathon => ({
                          ...hackathon,
                          image: typeof hackathon.image === 'string' && hackathon.image.startsWith('bg-gradient')
                            ? hackathon.image
                            : `bg-gradient-to-br from-[#6A0DAD] to-[#9B4DFF]`
                        }));
                        setFeaturedHackathons(formattedHackathons);
                      }
                    } catch (error) {
                      console.error('Error fetching hackathons:', error);
                      setHackathonsError(error instanceof Error ? error.message : 'Failed to load hackathons');
                    } finally {
                      setIsLoadingHackathons(false);
                    }
                  }}
                  className="flex items-center space-x-2 text-[#6A0DAD] hover:text-[#9B4DFF] transition-colors"
                  disabled={isLoadingHackathons}
                >
                  <RefreshCw size={16} className={isLoadingHackathons ? 'animate-spin' : ''} />
                  <span className="text-sm font-medium">Refresh</span>
                </button>
              </div>
            )}
          </div>

          {isLoadingHackathons ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                  <div className="h-32 bg-gray-200"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : hackathonsError ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Hackathons</h3>
              <p className="text-gray-600 mb-4">{hackathonsError}</p>
              <button
                onClick={async () => {
                  setIsLoadingHackathons(true);
                  setHackathonsError(null);
                  try {
                    const response = await fetchHackathons('upcoming', 10, 1);
                    if (response.success && response.hackathons) {
                      const formattedHackathons = response.hackathons.map(hackathon => ({
                        ...hackathon,
                        image: typeof hackathon.image === 'string' && hackathon.image.startsWith('bg-gradient')
                          ? hackathon.image
                          : `bg-gradient-to-br from-[#6A0DAD] to-[#9B4DFF]`
                      }));
                      setFeaturedHackathons(formattedHackathons);
                    }
                  } catch (error) {
                    setHackathonsError(error instanceof Error ? error.message : 'Failed to load hackathons');
                  } finally {
                    setIsLoadingHackathons(false);
                  }
                }}
                className="bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Try Again
              </button>
            </div>
          ) : featuredHackathons.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Hackathons Available</h3>
              <p className="text-gray-600">Check back soon for upcoming hackathons!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredHackathons.map((hackathon) => (
                <div key={hackathon.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <div className={`h-32 ${hackathon.image || 'bg-gradient-to-br from-[#6A0DAD] to-[#9B4DFF]'} flex items-center justify-center`}>
                    <div className="text-center text-white">
                      <Trophy size={32} className="mx-auto mb-2" />
                      <p className="font-bold text-lg">{hackathon.prize || 'TBA'}</p>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 leading-tight">{hackathon.title}</h3>
                      {hackathon.difficulty && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(hackathon.difficulty)}`}>
                          {hackathon.difficulty}
                        </span>
                      )}
                    </div>

                    {hackathon.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{hackathon.description}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600 text-sm">
                        <Calendar size={14} className="mr-2 flex-shrink-0" />
                        <span>{hackathon.date}</span>
                      </div>
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin size={14} className="mr-2 flex-shrink-0" />
                        <span>{hackathon.location}</span>
                        {hackathon.isVirtual && (
                          <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">Virtual</span>
                        )}
                      </div>
                      <div className="flex items-center text-gray-600 text-sm">
                        <Users size={14} className="mr-2 flex-shrink-0" />
                        <span>{hackathon.participants} participants</span>
                      </div>
                      {hackathon.deadline && (
                        <div className="flex items-center text-gray-600 text-sm">
                          <Clock size={14} className="mr-2 flex-shrink-0" />
                          <span>Deadline: {hackathon.deadline}</span>
                        </div>
                      )}
                    </div>

                    {hackathon.tags && hackathon.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {hackathon.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span key={tagIndex} className="px-2 py-1 bg-[#6A0DAD]/10 text-[#6A0DAD] rounded-lg text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <a
                      href={hackathon.registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <span>Register Now</span>
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Project Ideas */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Project Ideas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectIdeas.map((project, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Code className="text-[#6A0DAD]" size={20} />
                    <h3 className="font-semibold text-gray-900">{project.title}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(project.difficulty)}`}>
                    {project.difficulty}
                  </span>
                </div>

                <p className="text-gray-600 mb-4">{project.description}</p>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech, techIndex) => (
                      <span key={techIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6A0DAD] font-medium">{project.category}</span>
                    <button className="flex items-center space-x-1 text-[#6A0DAD] hover:text-[#9B4DFF] transition-colors">
                      <Rocket size={16} />
                      <span className="text-sm font-medium">Start Project</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}