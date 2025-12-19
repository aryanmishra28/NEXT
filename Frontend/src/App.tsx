// src/App.tsx
import React, { useState } from "react";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./components/Dashboard";
import { HackathonIdeas } from "./components/HackathonIdeas";
import { ResumeAnalyzer } from "./components/ResumeAnalyzer";
import { JobsAndUpdates } from "./components/JobsAndUpdates";
import { AICareerChat } from "./components/AICareerChat";
import { AuthModal } from "./components/AuthModal";

// Auth
import { AuthProvider, useAuth as useAuthFromCtx } from "./components/AuthContext";
export const useAuth = useAuthFromCtx;

function AppContent() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { loading } = useAuthFromCtx();

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#6A0DAD] to-[#9B4DFF] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center mx-auto animate-pulse">
            <span className="text-white text-3xl font-bold">NS</span>
          </div>
          <div className="space-y-2">
            <p className="text-white text-xl font-medium">NEXT STEP</p>
            <p className="text-white/70">Loading your career dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // 🔁 TAB RENDERING (UPDATED)
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onTabChange={setActiveTab} />;

      case "hackathons":
        return <HackathonIdeas />;

      case "resume":
        return <ResumeAnalyzer />;

      case "jobs":
        return <JobsAndUpdates />;

      case "ai-chat":
        return <AICareerChat />;

      default:
        return <Dashboard onTabChange={setActiveTab} />;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onAuthClick={() => setShowAuthModal(true)}
        />
        <main className="pb-20 md:pb-0">{renderContent()}</main>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
