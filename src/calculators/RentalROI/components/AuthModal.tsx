
import { useState } from 'react';
import type { User } from '../types';

interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

const USERS_STORAGE_KEY = 'roi_registered_users';
const WAITLIST_STORAGE_KEY = 'roi_waitlist';

// Simple hash function for password (not cryptographically secure, but better than plaintext)
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

const getStoredUsers = (): StoredUser[] => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveUser = (user: StoredUser): void => {
  const users = getStoredUsers();
  users.push(user);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

const findUser = (email: string): StoredUser | undefined => {
  const users = getStoredUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

const saveToWaitlist = (email: string): void => {
  const stored = localStorage.getItem(WAITLIST_STORAGE_KEY);
  const waitlist: string[] = stored ? JSON.parse(stored) : [];
  if (!waitlist.includes(email.toLowerCase())) {
    waitlist.push(email.toLowerCase());
    localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(waitlist));
  }
};

const AuthModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'signup' | 'login' | 'waitlist'>('signup');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'verifying' | 'waitlist-success'>('form');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      if (mode === 'login') {
        // Login: validate credentials
        const existingUser = findUser(email);
        if (!existingUser) {
          setError('No account found with this email. Please sign up first.');
          setLoading(false);
          return;
        }
        if (existingUser.passwordHash !== hashPassword(password)) {
          setError('Incorrect password. Please try again.');
          setLoading(false);
          return;
        }
        // Login successful
        setStep('verifying');
        setTimeout(() => {
          onSuccess({
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            isVerified: true,
          });
        }, 1500);
      } else if (mode === 'signup') {
        // Sign up: check if email exists
        if (findUser(email)) {
          setError('An account with this email already exists. Please sign in.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        // Create new user
        const newUser: StoredUser = {
          id: `u${Date.now()}`,
          email: email,
          name: name,
          passwordHash: hashPassword(password),
        };
        saveUser(newUser);
        setStep('verifying');
        setTimeout(() => {
          onSuccess({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            isVerified: true,
          });
        }, 1500);
      }
    }, 500);
  };

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      saveToWaitlist(email);
      setStep('waitlist-success');
      setLoading(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === 'form' && mode !== 'waitlist' ? (
          <div className="p-10">
            <div className="mb-8 text-center">
              <div className="bg-indigo-600 text-white w-12 h-12 flex items-center justify-center rounded-2xl font-black text-2xl italic mx-auto mb-4">R</div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                {mode === 'login' ? 'Welcome Back' : 'Get Full Report'}
              </h3>
              <p className="text-slate-500 font-medium text-sm">
                Includes Opportunity Score, Comparables, Investment Summary and more
              </p>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all"
                />
                {mode === 'signup' && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all"
                  />
                )}
                <input
                  type="password"
                  placeholder={mode === 'login' ? "Password" : "Password (min 6 characters)"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all"
                />

                <button
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                >
                  {loading && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/></svg>}
                  {mode === 'login' ? 'Sign In' : 'Create Free Account'}
                </button>
              </form>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setError(null);
                    setPassword('');
                  }}
                  className="w-full text-center text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
                <button
                  onClick={() => {
                    setMode('waitlist');
                    setError(null);
                  }}
                  className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Just want updates? Join the waiting list
                </button>
              </div>
            </div>
          </div>
        ) : step === 'form' && mode === 'waitlist' ? (
          <div className="p-10">
            <div className="mb-8 text-center">
              <div className="bg-blue-500 text-white w-12 h-12 flex items-center justify-center rounded-2xl mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                Be the First to Know
              </h3>
              <p className="text-slate-500 font-medium text-sm">
                Join our waiting list and get notified about new features and updates
              </p>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleWaitlist} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                />

                <button
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/></svg>}
                  Join Waiting List
                </button>
              </form>

              <button
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="w-full text-center text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
              >
                Want full access? Create an account instead
              </button>
            </div>
          </div>
        ) : step === 'waitlist-success' ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">You're on the List!</h3>
            <p className="text-slate-500 font-medium mb-8">
              Thanks for joining! We'll notify you when new features are available.
            </p>
            <button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Verified & Loading</h3>
            <p className="text-slate-500 font-medium mb-8">
              Welcome aboard! Your full investment report is being generated and your download will start automatically.
            </p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 animate-[loading_2s_ease-in-out_infinite]"></div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default AuthModal;
