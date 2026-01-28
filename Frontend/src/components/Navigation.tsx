import React from 'react';
import { useAuth } from './AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import {
  Home,
  Lightbulb,
  FileText,
  Bot,
  User,
  Menu,
  X
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAuthClick: () => void;
}

export function Navigation({ activeTab, setActiveTab, onAuthClick }: NavigationProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // ✅ UPDATED NAV ITEMS (Mentors → AI Mentor)
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'hackathons', label: 'Hackathons', icon: Lightbulb },
    { id: 'resume', label: 'Resume', icon: FileText },
    { id: 'ai-chat', label: 'AI Mentor', icon: Bot },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* ================= Desktop Navigation ================= */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">NS</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] bg-clip-text text-transparent">
                NEXT STEP
              </span>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <button
                    onClick={() => handleTabChange('profile')}
                    aria-label="Open profile"
                    className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#6A0DAD]"
                  >
                    <Avatar>
                      {user.picture ? (
                        <AvatarImage src={user.picture} alt={user.name || 'User'} />
                      ) : (
                        <AvatarFallback>{(user.name || 'U').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</AvatarFallback>
                      )}
                    </Avatar>
                  </button>
                  <div className="text-sm text-right">
                    <p className="font-medium text-gray-900">Welcome back!</p>
                    <p className="text-gray-500">{user.name}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <User size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={onAuthClick}
                  className="bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                >
                  Sign In
                </button>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* ================= Mobile Navigation ================= */}
      <div className="md:hidden">

        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">NS</span>
              </div>
              <span className="font-bold bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] bg-clip-text text-transparent">
                NEXT STEP
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {user ? (
                <button onClick={logout} className="p-2 text-gray-600">
                  <User size={20} />
                </button>
              ) : (
                <button
                  onClick={onAuthClick}
                  className="text-sm bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] text-white px-4 py-2 rounded-lg"
                >
                  Sign In
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setMobileMenuOpen(false)} />
        )}

        <div className={`fixed top-16 left-0 right-0 z-50 bg-white border-b transition-transform ${
          mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <div className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl ${
                    isActive
                      ? 'bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 border-t">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex flex-col items-center space-y-1 ${
                    isActive ? 'text-[#6A0DAD]' : 'text-gray-400'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}
