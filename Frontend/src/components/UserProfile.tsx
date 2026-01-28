import React from 'react';
import { useAuth } from './AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Mail } from 'lucide-react';

export function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-yellow-900">
          Please sign in to view your profile.
        </div>
      </div>
    );
  }

  const initials = (user.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-6">
            <Avatar>
              {user.picture ? (
                <AvatarImage src={user.picture} alt={user.name || 'User'} />
              ) : (
                <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name || 'User'}</h1>
              <div className="flex items-center text-gray-600 mt-1">
                <Mail size={16} className="mr-2" />
                <span>{user.email}</span>
              </div>
            </div>
            <div className="flex-1" />
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">Profile Completion</p>
              <p className="text-lg font-semibold mt-1">{user.name ? '60%' : '20%'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">Resume Score</p>
              <p className="text-lg font-semibold mt-1">Not started</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">Connections</p>
              <p className="text-lg font-semibold mt-1">0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
