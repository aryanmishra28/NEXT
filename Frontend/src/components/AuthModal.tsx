import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { registerUser, googleSignIn } from '../utils/api';

declare global {
  interface Window {
    google: any;
    __googleSignInWarningShown?: boolean;
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use auth from context once at top-level
  const { login, refreshUser } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!isLogin) {
        // Register first
        if (!name.trim()) {
          setError('Full name is required');
          setIsLoading(false);
          return;
        }
        const registerResponse = await registerUser(name, email, password);
        console.log('Registration successful:', registerResponse);
      }
      // Then login
      const loginResponse = await login(email, password);
      console.log('Login successful:', loginResponse);

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      onClose();
      // Reset form
      setEmail('');
      setPassword('');
      setName('');
      setError(null);
    } catch (error: any) {
      console.error('Auth error:', error);
      let errorMessage = 'An error occurred. Please try again.';
      if (error?.message) {
        errorMessage = error.message;
        if (error.message.includes('Network error') || error.message.includes('Could not connect')) {
          errorMessage = 'Cannot connect to server. Please make sure the backend server is running on port 5000.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please check the backend logs for details.';
        }
      }
      setError(errorMessage);
      // Don't close modal on error
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
  };

// Handle Google Sign-in response
  const handleGoogleSignIn = useCallback(
  async (response: any) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!response?.credential) {
        throw new Error('No Google credential received');
      }

      // Send id token to backend (googleSignIn util posts { idToken })
      const authResponse = await googleSignIn(response.credential);

      // Check backend response before proceeding
      if (!authResponse || !authResponse.success) {
        const msg = authResponse?.message || 'Google sign-in failed on server';
        throw new Error(msg);
      }

      // Backend should set httpOnly cookie. Refresh user state from backend.
      await refreshUser();

      // Close modal on success
      onClose();
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setError(error?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  },
  [onClose, refreshUser]
);


  // Initialize Google Sign-in button
  useEffect(() => {
    if (!isOpen || !googleButtonRef.current) return;

    // Clear any existing button
    if (googleButtonRef.current) {
      googleButtonRef.current.innerHTML = '';
    }

    // Wait for Google script to load
    let retryCount = 0;
    const maxRetries = 50; // 5 seconds max

    const initGoogleSignIn = () => {
      if (window.google && window.google.accounts && googleButtonRef.current) {
        try {
          // Get Google Client ID from environment or use placeholder
          const clientId =
            (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
            (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
            '';

          // Only initialize if we have a valid client ID
          if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID' || clientId.trim() === '') {
            if (!window.__googleSignInWarningShown) {
              console.info(
                'Google Sign-in is not configured. To enable it, add VITE_GOOGLE_CLIENT_ID to your .env file.'
              );
              window.__googleSignInWarningShown = true;
            }
            if (googleButtonRef.current) {
              googleButtonRef.current.innerHTML =
                '<button type="button" disabled class="w-full flex items-center justify-center space-x-3 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"><span className="font-medium">Google Sign-in (Not Configured)</span></button>';
            }
            return;
          }

          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleSignIn,
          });

          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: '100%',
          });
        } catch (error) {
          console.error('Error initializing Google Sign-in:', error);
          if (googleButtonRef.current) {
            googleButtonRef.current.innerHTML =
              '<button type="button" disabled class="w-full flex items-center justify-center space-x-3 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"><span className="font-medium">Google Sign-in (Error)</span></button>';
          }
        }
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(initGoogleSignIn, 100);
      }
    };

    initGoogleSignIn();

    // Cleanup function
    return () => {
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
      }
    };
  }, [isOpen, handleGoogleSignIn]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>

          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">NS</span>
            </div>
            <h2 className="text-2xl font-bold">{isLogin ? 'Welcome Back!' : 'Join NEXT STEP'}</h2>
            <p className="text-white/80">
              {isLogin ? 'Sign in to continue your career journey' : 'Start your career growth journey today'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6A0DAD] focus:border-[#6A0DAD] transition-colors"
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6A0DAD] focus:border-[#6A0DAD] transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6A0DAD] focus:border-[#6A0DAD] transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-[#6A0DAD] focus:ring-[#6A0DAD]" />
                  <span className="ml-2 text-gray-600">Remember me</span>
                </label>
                <button type="button" className="text-[#6A0DAD] hover:text-[#9B4DFF] font-medium">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] text-white py-3 rounded-xl font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                </div>
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {/* Google Sign-in Button */}
              <div ref={googleButtonRef} className="w-full flex justify-center min-h-[40px]">
                {/* Placeholder text will be replaced by Google button */}
              </div>

              {/* Facebook Sign-in (placeholder) */}
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center space-x-3 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"
              >
                <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">f</span>
                </div>
                <span className="font-medium">Continue with Facebook (Coming Soon)</span>
              </button>
            </div>
          </div>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button onClick={toggleMode} className="text-[#6A0DAD] hover:text-[#9B4DFF] font-medium transition-colors">
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
