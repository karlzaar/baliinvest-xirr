import { useState } from 'react';
import AuthModal from '../ui/AuthModal';
import { Toast } from '../ui/Toast';
import { useAuth } from '../../lib/auth-context';
import { logoutUser, sendPasswordReset } from '../../lib/auth-store';

export function Header() {
  const [showAuth, setShowAuth] = useState(false);
  const { user, loading } = useAuth();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <header className="w-full bg-white border-b border-slate-200">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => setShowAuth(false)}
        hideWaitlist
      />

      <div className="mx-auto max-w-7xl px-4 md:px-10 lg:px-20 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-16 h-16"
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">ROI Calculate</h1>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Property Investment Tools</p>
            </div>
          </div>

          {/* Profile Section */}
          <div className="flex items-center">
            {loading ? (
              <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                <div className="w-20 h-4 bg-slate-200 rounded animate-pulse" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600 uppercase">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-700">{user.name}</span>
                  <span className="text-[10px] text-slate-400">{user.email}</span>
                </div>
                <button
                  onClick={async () => {
                    if (user.email) {
                      const result = await sendPasswordReset(user.email);
                      if (result.success) {
                        setToast({ message: 'Password reset link sent — check your email', type: 'success' });
                      } else {
                        setToast({ message: result.error || 'Failed to send reset link', type: 'error' });
                      }
                    }
                  }}
                  className="ml-2 text-slate-400 hover:text-amber-500 transition-colors"
                  title="Reset password"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </button>
                <button
                  onClick={handleLogout}
                  className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                  title="Sign out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs font-semibold text-slate-600">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
