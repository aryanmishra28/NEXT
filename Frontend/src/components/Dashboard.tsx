// src/components/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { updateUserActivity } from "../utils/api";
import {
  Calendar,
  ArrowRight,
  Users,
  Lightbulb,
  FileText,
} from "lucide-react";

interface DashboardProps {
  onTabChange: (tab: string) => void;
}

type UserShape = {
  id: string;
  name?: string;
  email?: string;
  picture?: string | null;
  resumeScore?: number | null;
  hackathonsCount?: number | null;
  connectionsCount?: number | null;
  recentActivity?: Array<{ type?: string; message: string; time?: string }>;
  upcomingEvents?: Array<{ title: string; date: string; type?: string }>;
} | null;

export function Dashboard({ onTabChange }: DashboardProps) {
  const { user } = useAuth();
  const [statsState, setStatsState] = useState({
    resumeScore: null as number | null,
    hackathonsCount: null as number | null,
    connectionsCount: null as number | null,
  });
  const [recentActivityState, setRecentActivityState] = useState<any[]>([]);
  const [upcomingEventsState, setUpcomingEventsState] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  // Helper to get initials
  const initials = (name?: string) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "U";

  // Static demo data for guests
  const guestStats = [
    {
      label: "Resume Score",
      value: "85",
      change: "+12",
      icon: FileText,
      color: "from-green-500 to-emerald-500",
    },
    {
      label: "Hackathons",
      value: "7",
      change: "+2",
      icon: Lightbulb,
      color: "from-yellow-500 to-orange-500",
    },
    {
      label: "Connections",
      value: "156",
      change: "+18",
      icon: Users,
      color: "from-purple-500 to-pink-500",
    },
  ];

  const guestRecentActivity = [
    { type: "resume", message: "Try our AI-powered resume analyzer", time: "Get started" },
    { type: "hackathon", message: "Explore hackathon opportunities", time: "Browse now" },
    { type: "mentor", message: "Connect with industry mentors", time: "Learn more" },
  ];

  const guestUpcomingEvents = [
    { title: "AI/ML Hackathon", date: "Dec 15-17", type: "Hackathon" },
    { title: "Career Fair 2024", date: "Dec 20", type: "Event" },
    { title: "Tech Meetup", date: "Dec 22", type: "Networking" },
  ];

  // Real-time data fetching for logged-in users
  useEffect(() => {
    const fetchRealTimeData = async () => {
      if (!user) {
        // Clear state for sign-out
        setStatsState({
          resumeScore: null,
          hackathonsCount: null,
          connectionsCount: null,
        });
        setRecentActivityState([]);
        setUpcomingEventsState([]);
        return;
      }

      try {
        setLoadingStats(true);
        const base = import.meta.env.VITE_API_BASE ?? "http://localhost:5000";
        
        // Fetch user's real-time stats
        const statsRes = await fetch(`${base}/api/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (statsRes.ok) {
          const userData = await statsRes.json();
          
          // Set real user data or defaults
          setStatsState({
            resumeScore: userData.user?.resumeScore ?? null,
            hackathonsCount: userData.user?.hackathonsCount ?? null,
            connectionsCount: userData.user?.connectionsCount ?? null,
          });
          
          // Fetch recent activity for this user
          const activityRes = await fetch(`${base}/api/users/${user.id}/activity`, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }).catch(() => null); // Don't fail if endpoint doesn't exist yet
          
          if (activityRes && activityRes.ok) {
            const activityData = await activityRes.json();
            setRecentActivityState(activityData.activities ?? []);
          } else {
            // Default activity for new users
            setRecentActivityState([
              { type: "welcome", message: `Welcome to NEXT STEP, ${user.name || 'User'}!`, time: "Just now" },
              { type: "account", message: "Account created successfully", time: "Today" },
            ]);
          }
          
          // Fetch upcoming events for this user
          const eventsRes = await fetch(`${base}/api/users/${user.id}/events`, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }).catch(() => null); // Don't fail if endpoint doesn't exist yet
          
          if (eventsRes && eventsRes.ok) {
            const eventsData = await eventsRes.json();
            setUpcomingEventsState(eventsData.events ?? []);
          } else {
            // Default events for users
            setUpcomingEventsState([
              { title: "Complete Your Profile", date: "Today", type: "Task" },
              { title: "Upload Your Resume", date: "This week", type: "Action" },
            ]);
          }
        }
      } catch (err) {
        console.error("Error fetching real-time data:", err);
        // Set default data for logged-in users if API fails
        setRecentActivityState([
          { type: "welcome", message: `Welcome back, ${user.name || 'User'}!`, time: "Just now" },
        ]);
        setUpcomingEventsState([
          { title: "Complete Your Profile", date: "Today", type: "Task" },
        ]);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchRealTimeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Dynamic stats based on user login status
  const stats = user ? [
    {
      label: "Resume Score",
      value: loadingStats ? "..." : (statsState.resumeScore?.toString() ?? "0"),
      change: statsState.resumeScore ? "+12" : "Upload resume",
      icon: FileText,
      color: "from-green-500 to-emerald-500",
    },
    {
      label: "Hackathons",
      value: loadingStats ? "..." : (statsState.hackathonsCount?.toString() ?? "0"),
      change: statsState.hackathonsCount ? "+2" : "Join events",
      icon: Lightbulb,
      color: "from-yellow-500 to-orange-500",
    },
    {
      label: "Connections",
      value: loadingStats ? "..." : (statsState.connectionsCount?.toString() ?? "0"),
      change: statsState.connectionsCount ? "+18" : "Start networking",
      icon: Users,
      color: "from-purple-500 to-pink-500",
    },
  ] : guestStats;

  // Dynamic activity and events based on user login status
  const currentActivity = user ? recentActivityState : guestRecentActivity;
  const currentEvents = user ? upcomingEventsState : guestUpcomingEvents;

  // Test function to add new activity (for demonstrating real-time updates)
  const handleTestActivity = async () => {
    if (!user) return;
    
    const activities = [
      { type: "test", message: "Tested dashboard functionality ✅", time: "Just now" },
      { type: "explore", message: "Explored career dashboard features", time: "Now" },
      { type: "demo", message: "Real-time activity update successful! 🎉", time: "Right now" },
      { type: "interaction", message: "Clicked test button - data updated live!", time: "Moments ago" }
    ];
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    
    try {
      const result = await updateUserActivity(randomActivity);
      if (result.success) {
        // Update the local state with the new activity
        setRecentActivityState(prev => [
          result.activity,
          ...prev.slice(0, 4) // Keep only the most recent 5 activities
        ]);
        
        // Show a brief success message
        console.log("✅ Activity added successfully:", result.activity.message);
      }
    } catch (error) {
      console.error("Failed to add test activity:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#6A0DAD] via-[#8B5FBF] to-[#9B4DFF] relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5" />
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="text-center text-white space-y-6">
            {user ? (
              // Personalized welcome for logged-in users
              <>
                <h1 className="text-4xl md:text-5xl font-bold">
                  Welcome back{user.name ? `, ${user.name}` : ""}! 🚀
                </h1>
                <p className="text-xl text-white/90 max-w-2xl mx-auto">
                  Track your real progress, view personalized insights, and accelerate your career growth
                </p>
                {loadingStats && (
                  <div className="flex items-center justify-center space-x-2 text-white/70">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Loading your data...</span>
                  </div>
                )}
                {/* Test Real-time Updates Button */}
                <div className="mt-4">
                  <button
                    onClick={handleTestActivity}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-lg border border-white/20 px-4 py-2 rounded-xl text-white font-medium transition-all duration-200"
                  >
                    ✨ Test Real-time Updates
                  </button>
                  <p className="text-sm text-white/70 mt-2">
                    Click to add a test activity and see real-time data in action!
                  </p>
                </div>
              </>
            ) : (
              // Demo content for guests
              <>
                <h1 className="text-4xl md:text-5xl font-bold">
                  Welcome to Your Career Journey
                </h1>
                <div className="text-2xl md:text-3xl mt-2 text-white/90">
                  Hello, Guest! 👋
                </div>
                <p className="text-xl text-white/90 max-w-2xl mx-auto">
                  Discover how NEXT STEP can help you track progress, find opportunities, and accelerate your career growth
                </p>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 max-w-lg mx-auto">
                  <p className="text-sm text-white/80">✨ This is a demo dashboard. Sign in to see your personalized data!</p>
                </div>
              </>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center space-y-3 border border-white/20 hover:bg-white/20 hover:shadow-xl transition-all">
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mx-auto shadow-md`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-white tracking-tight">{stat.value}</p>
                    <p className="text-white/70 text-sm">{stat.label}</p>
                    <p className={`text-sm font-medium ${
                      user && (stat.value === "0" || stat.value === "...") 
                        ? "text-yellow-300" 
                        : "text-green-300"
                    }`}>
                      {user && stat.value === "0" 
                        ? stat.change 
                        : user 
                        ? (loadingStats ? "Loading..." : stat.change) 
                        : stat.change
                      }
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              onClick={() => onTabChange("resume")}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-200 cursor-pointer group hover:-translate-y-[2px]"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] rounded-xl flex items-center justify-center mb-4">
                <FileText size={20} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Analyze Resume</h3>
              <p className="text-gray-600 text-sm mb-4">Get AI-powered insights to improve your resume</p>
              <div className="flex items-center text-sm font-medium text-[#6A0DAD] group-hover:translate-x-1 transition-transform duration-200">
                Get Started <ArrowRight size={16} className="ml-1" />
              </div>
            </div>

            <div
              onClick={() => onTabChange("hackathons")}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-200 cursor-pointer group hover:-translate-y-[2px]"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mb-4">
                <Lightbulb size={20} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Find Hackathons</h3>
              <p className="text-gray-600 text-sm mb-4">Discover upcoming hackathons and build your portfolio</p>
              <div className="flex items-center text-sm font-medium text-[#6A0DAD] group-hover:translate-x-1 transition-transform duration-200">
                Get Started <ArrowRight size={16} className="ml-1" />
              </div>
            </div>

            <div
              onClick={() => onTabChange("ai-chat")}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-200 cursor-pointer group hover:-translate-y-[2px]"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <Users size={20} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Mentor Chat</h3>
              <p className="text-gray-600 text-sm mb-4">Get AI-powered guidance for your career</p>
              <div className="flex items-center text-sm font-medium text-[#6A0DAD] group-hover:translate-x-1 transition-transform duration-200">
                Get Started <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {user ? "Recent Activity" : "What You Can Do"}
              </h3>
              <div className="space-y-4">
                {loadingStats ? (
                  <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                ) : (
                  currentActivity.map((activity, index) => (
                    <div key={index} className={`flex items-start space-x-4 p-4 rounded-xl ${
                      user ? "bg-gray-50 hover:shadow-md" : "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 hover:shadow-md"
                    } transition-shadow`}>
                      <div className="w-10 h-10 bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <div className="w-3 h-3 bg-white rounded-full" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{activity.message}</p>
                        <p className="text-gray-500 text-sm">{activity.time}</p>
                      </div>
                    </div>
                  ))
                )}
                {!user && (
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 mb-4">Sign in to see your personalized activity feed</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Events + Career Progress */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {user ? "Your Schedule" : "Upcoming Events"}
              </h3>
              <div className="space-y-4">
                {currentEvents.map((event, index) => (
                  <div key={index} className={`p-4 rounded-xl border transition-colors ${
                    user 
                      ? "border-gray-200 hover:border-[#6A0DAD] hover:shadow-md" 
                      : "border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user 
                          ? "bg-[#6A0DAD]/10 text-[#6A0DAD]" 
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {event.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {event.date}
                    </p>
                  </div>
                ))}
                {!user && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-sm text-yellow-800">
                      🎯 Sign in to see personalized events and tasks
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mt-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {user ? "Your Progress" : "Sample Progress"}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Profile Completion</span>
                  <span className="font-medium">
                    {user 
                      ? (user.name ? "60%" : "20%") 
                      : "85%"
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] h-3 rounded-full transition-all duration-1000" 
                    style={{ 
                      width: user 
                        ? (user.name ? "60%" : "20%") 
                        : "85%" 
                    }} 
                  />
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-gray-600">
                    {user ? "Resume Analysis" : "Skill Assessment"}
                  </span>
                  <span className="font-medium">
                    {user 
                      ? (statsState.resumeScore ? `${statsState.resumeScore}%` : "Not started") 
                      : "92%"
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-1000" 
                    style={{ 
                      width: user 
                        ? (statsState.resumeScore ? `${statsState.resumeScore}%` : "0%") 
                        : "92%" 
                    }} 
                  />
                </div>
                
                {user && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800">
                      💡 Complete your profile and upload your resume to see real progress!
                    </p>
                  </div>
                )}
                
                {!user && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm text-green-800">
                      ✨ This shows sample progress. Sign in to track your real achievements!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}