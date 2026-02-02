import { useState, useCallback, useEffect } from 'react';
import { loginSchema, registerSchema, waitlistSchema, formatZodErrors, type ValidationError } from '../../lib/validations';
import { checkPasswordStrength, type PasswordStrength } from '../../lib/crypto-utils';
import { authRateLimiter, waitlistRateLimiter } from '../../lib/rate-limit';
import { registerUser, loginUser, addToWaitlist, sendPasswordReset, type User } from '../../lib/auth-store';

// Re-export User type for consumers
export type { User };

export type AuthMode = 'login' | 'signup' | 'waitlist';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialMode?: AuthMode;
  hideWaitlist?: boolean;
}

type AuthStep = 'form' | 'processing' | 'success' | 'confirm-email' | 'waitlist-success' | 'forgot-email' | 'forgot-sent';

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, initialMode = 'signup', hideWaitlist = false }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthStep>('form');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  // Rate limit status
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setStep('form');
      setErrors([]);
      setGeneralError(null);
      setRateLimitMessage(null);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setPasswordStrength(null);
    }
  }, [isOpen, initialMode]);

  // Update password strength when password changes
  useEffect(() => {
    if (password && mode === 'signup') {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength(null);
    }
  }, [password, mode]);

  const getFieldError = useCallback((field: string): string | undefined => {
    return errors.find(e => e.field === field)?.message;
  }, [errors]);

  const handleLogin = useCallback(async () => {
    setErrors([]);
    setGeneralError(null);
    setRateLimitMessage(null);

    // Validate input
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setErrors(formatZodErrors(result.error));
      return;
    }

    // Check rate limit
    const rateLimitResult = authRateLimiter.check(email.toLowerCase());
    if (!rateLimitResult.allowed) {
      setRateLimitMessage(rateLimitResult.message || 'Too many attempts. Please try again later.');
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      const authResult = await loginUser(email, password);

      if (!authResult.success) {
        authRateLimiter.recordFailure(email.toLowerCase());
        setGeneralError(authResult.error || 'Login failed');
        setStep('form');
        setLoading(false);
        return;
      }

      // Success - reset rate limiter
      authRateLimiter.reset(email.toLowerCase());
      setStep('success');

      setTimeout(() => {
        if (authResult.user) {
          onSuccess(authResult.user);
        }
      }, 1500);
    } catch (err) {
      console.error('Login error:', err);
      setGeneralError('An unexpected error occurred. Please try again.');
      setStep('form');
      setLoading(false);
    }
  }, [email, password, onSuccess]);

  const handleSignup = useCallback(async () => {
    setErrors([]);
    setGeneralError(null);
    setRateLimitMessage(null);

    // Validate input
    const result = registerSchema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      setErrors(formatZodErrors(result.error));
      return;
    }

    // Check password strength
    const strength = checkPasswordStrength(password);
    if (strength.level === 'weak') {
      setGeneralError('Please choose a stronger password');
      return;
    }

    // Check rate limit
    const rateLimitResult = authRateLimiter.check(email.toLowerCase());
    if (!rateLimitResult.allowed) {
      setRateLimitMessage(rateLimitResult.message || 'Too many attempts. Please try again later.');
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      const authResult = await registerUser(name, email, password);

      if (!authResult.success) {
        setGeneralError(authResult.error || 'Registration failed');
        setStep('form');
        setLoading(false);
        return;
      }

      // Success
      authRateLimiter.reset(email.toLowerCase());

      if (authResult.confirmEmail) {
        setStep('confirm-email');
        setLoading(false);
      } else {
        setStep('success');
        setTimeout(() => {
          if (authResult.user) {
            onSuccess(authResult.user);
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setGeneralError('An unexpected error occurred. Please try again.');
      setStep('form');
      setLoading(false);
    }
  }, [name, email, password, confirmPassword, onSuccess]);

  const handleWaitlist = useCallback(async () => {
    setErrors([]);
    setGeneralError(null);
    setRateLimitMessage(null);

    // Validate input
    const result = waitlistSchema.safeParse({ email });
    if (!result.success) {
      setErrors(formatZodErrors(result.error));
      return;
    }

    // Check rate limit
    const rateLimitResult = waitlistRateLimiter.check(email.toLowerCase());
    if (!rateLimitResult.allowed) {
      setRateLimitMessage(rateLimitResult.message || 'Please wait before trying again.');
      return;
    }

    setLoading(true);

    try {
      const success = addToWaitlist(email);
      if (success) {
        setStep('waitlist-success');
      } else {
        setGeneralError('Failed to join waitlist. Please try again.');
      }
    } catch {
      setGeneralError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  // ---- Forgot Password Handler ----

  const handleForgotSendCode = useCallback(async () => {
    setErrors([]);
    setGeneralError(null);

    if (!email || !email.includes('@')) {
      setGeneralError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    const result = await sendPasswordReset(email);
    setLoading(false);

    if (result.success) {
      setStep('forgot-sent');
    } else {
      setGeneralError(result.error || 'Failed to send reset link');
    }
  }, [email]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    switch (mode) {
      case 'login':
        handleLogin();
        break;
      case 'signup':
        handleSignup();
        break;
      case 'waitlist':
        handleWaitlist();
        break;
    }
  }, [mode, handleLogin, handleSignup, handleWaitlist]);

  const switchMode = useCallback((newMode: AuthMode) => {
    setMode(newMode);
    setErrors([]);
    setGeneralError(null);
    setRateLimitMessage(null);
    setPassword('');
    setConfirmPassword('');
    setPasswordStrength(null);
  }, []);

  if (!isOpen) return null;

  const getStrengthColor = (level: PasswordStrength['level']) => {
    switch (level) {
      case 'weak': return 'bg-red-500';
      case 'fair': return 'bg-yellow-500';
      case 'good': return 'bg-blue-500';
      case 'strong': return 'bg-green-500';
    }
  };

  const getStrengthWidth = (score: number) => {
    return `${Math.min(100, (score / 7) * 100)}%`;
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-300 hover:text-slate-500 transition-colors z-10"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Form View */}
        {step === 'form' && mode !== 'waitlist' && (
          <div className="p-8">
            <div className="mb-6 text-center">
              <div className="bg-primary text-white w-14 h-14 flex items-center justify-center rounded-2xl font-black text-3xl italic mx-auto mb-4 shadow-lg shadow-primary/30">
                R
              </div>
              <h2 id="auth-modal-title" className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-slate-500 text-sm">
                {mode === 'login'
                  ? 'Sign in to access your investment reports'
                  : 'Get full access to XIRR calculations and reports'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Rate Limit Warning */}
              {rateLimitMessage && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm font-medium text-amber-700" role="alert">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {rateLimitMessage}
                  </div>
                </div>
              )}

              {/* General Error */}
              {generalError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-medium text-red-600" role="alert">
                  {generalError}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all ${
                    getFieldError('email') ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10'
                  }`}
                  aria-invalid={!!getFieldError('email')}
                  aria-describedby={getFieldError('email') ? 'email-error' : undefined}
                />
                {getFieldError('email') && (
                  <p id="email-error" className="mt-1.5 text-xs text-red-500 font-medium">{getFieldError('email')}</p>
                )}
              </div>

              {/* Name Field (Signup only) */}
              {mode === 'signup' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    autoComplete="name"
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all ${
                      getFieldError('name') ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10'
                    }`}
                    aria-invalid={!!getFieldError('name')}
                    aria-describedby={getFieldError('name') ? 'name-error' : undefined}
                  />
                  {getFieldError('name') && (
                    <p id="name-error" className="mt-1.5 text-xs text-red-500 font-medium">{getFieldError('name')}</p>
                  )}
                </div>
              )}

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'login' ? 'Enter your password' : 'Min 8 characters'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all ${
                    getFieldError('password') ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10'
                  }`}
                  aria-invalid={!!getFieldError('password')}
                  aria-describedby={getFieldError('password') ? 'password-error' : undefined}
                />
                {getFieldError('password') && (
                  <p id="password-error" className="mt-1.5 text-xs text-red-500 font-medium">{getFieldError('password')}</p>
                )}

                {/* Password Strength Indicator (Signup only) */}
                {mode === 'signup' && passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-500">Password strength</span>
                      <span className={`text-xs font-bold capitalize ${
                        passwordStrength.level === 'weak' ? 'text-red-500' :
                        passwordStrength.level === 'fair' ? 'text-yellow-600' :
                        passwordStrength.level === 'good' ? 'text-blue-500' : 'text-green-500'
                      }`}>
                        {passwordStrength.level}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength.level)}`}
                        style={{ width: getStrengthWidth(passwordStrength.score) }}
                      />
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <p className="mt-1.5 text-xs text-slate-500">
                        {passwordStrength.feedback[0]}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password Field (Signup only) */}
              {mode === 'signup' && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all ${
                      getFieldError('confirmPassword') ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10'
                    }`}
                    aria-invalid={!!getFieldError('confirmPassword')}
                    aria-describedby={getFieldError('confirmPassword') ? 'confirm-error' : undefined}
                  />
                  {getFieldError('confirmPassword') && (
                    <p id="confirm-error" className="mt-1.5 text-xs text-red-500 font-medium">{getFieldError('confirmPassword')}</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !!rateLimitMessage}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
                aria-busy={loading}
              >
                {loading && (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                  </svg>
                )}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* Mode Switcher */}
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
              {mode === 'login' && (
                <button
                  onClick={() => { setGeneralError(null); setStep('forgot-email'); }}
                  className="w-full text-center text-sm font-medium text-slate-400 hover:text-primary transition-colors"
                >
                  Forgot your password?
                </button>
              )}
              <button
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                className="w-full text-center text-sm font-medium text-slate-500 hover:text-primary transition-colors"
              >
                {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
              {!hideWaitlist && (
                <button
                  onClick={() => switchMode('waitlist')}
                  className="w-full text-center text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  Just want updates? Join the waitlist
                </button>
              )}
            </div>
          </div>
        )}

        {/* Waitlist Form */}
        {step === 'form' && mode === 'waitlist' && (
          <div className="p-8">
            <div className="mb-6 text-center">
              <div className="bg-blue-500 text-white w-14 h-14 flex items-center justify-center rounded-2xl mx-auto mb-4 shadow-lg shadow-blue-500/30">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h2 id="auth-modal-title" className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                Be the First to Know
              </h2>
              <p className="text-slate-500 text-sm">
                Join our waitlist for exclusive updates and early access
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {rateLimitMessage && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm font-medium text-amber-700" role="alert">
                  {rateLimitMessage}
                </div>
              )}

              {generalError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-medium text-red-600" role="alert">
                  {generalError}
                </div>
              )}

              <div>
                <label htmlFor="waitlist-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all ${
                    getFieldError('email') ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                />
                {getFieldError('email') && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium">{getFieldError('email')}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !!rateLimitMessage}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                  </svg>
                )}
                Join Waitlist
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <button
                onClick={() => switchMode('signup')}
                className="w-full text-center text-sm font-medium text-slate-500 hover:text-primary transition-colors"
              >
                Want full access? Create an account
              </button>
            </div>
          </div>
        )}

        {/* Processing State */}
        {step === 'processing' && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {mode === 'login' ? 'Signing you in...' : 'Creating your account...'}
            </h3>
            <p className="text-slate-500 text-sm">
              Please wait while we secure your session
            </p>
          </div>
        )}

        {/* Success State */}
        {step === 'success' && (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
              {mode === 'login' ? 'Welcome Back!' : 'Account Created!'}
            </h3>
            <p className="text-slate-500 mb-6">
              Preparing your investment dashboard...
            </p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-accent animate-[loading_1.5s_ease-in-out_infinite]"></div>
            </div>
          </div>
        )}

        {/* Confirm Email */}
        {step === 'confirm-email' && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
              Check Your Email
            </h3>
            <p className="text-slate-500 mb-2">
              We sent a confirmation link to
            </p>
            <p className="font-semibold text-slate-700 mb-6">
              {email}
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 mb-6 text-left">
              <p className="font-medium mb-1">Please confirm your email to complete signup.</p>
              <p className="text-slate-400 text-xs">Click the link in the email, then come back and sign in. Check your spam folder if you don't see it.</p>
            </div>
            <button
              onClick={() => { setStep('form'); setMode('login'); setPassword(''); setGeneralError(null); }}
              className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 transition-all"
            >
              Go to Sign In
            </button>
          </div>
        )}

        {/* Waitlist Success */}
        {step === 'waitlist-success' && (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
              You're on the List!
            </h3>
            <p className="text-slate-500 mb-8">
              Thanks for joining! We'll notify you about new features and updates.
            </p>
            <button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-3 rounded-xl font-bold text-sm transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Forgot Password - Enter Email */}
        {step === 'forgot-email' && (
          <div className="p-8">
            <div className="mb-6 text-center">
              <div className="bg-amber-500 text-white w-14 h-14 flex items-center justify-center rounded-2xl mx-auto mb-4 shadow-lg shadow-amber-500/30">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                Reset Password
              </h2>
              <p className="text-slate-500 text-sm">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            {generalError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-medium text-red-600 mb-4" role="alert">
                {generalError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                />
              </div>

              <button
                onClick={handleForgotSendCode}
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                  </svg>
                )}
                Send Reset Link
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <button
                onClick={() => { setGeneralError(null); setStep('form'); setMode('login'); }}
                className="w-full text-center text-sm font-medium text-slate-500 hover:text-primary transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* Forgot Password - Email Sent */}
        {step === 'forgot-sent' && (
          <div className="p-8">
            <div className="mb-6 text-center">
              <div className="bg-amber-500 text-white w-14 h-14 flex items-center justify-center rounded-2xl mx-auto mb-4 shadow-lg shadow-amber-500/30">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                Check Your Email
              </h2>
              <p className="text-slate-500 text-sm">
                We sent a password reset link to <span className="font-semibold text-slate-700">{email}</span>
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-6">
              <p className="font-medium mb-1">Didn't receive the email?</p>
              <p className="text-amber-600 text-xs">Check your spam folder, or make sure the email address is correct.</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleForgotSendCode}
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm transition-all"
              >
                {loading ? 'Sending...' : 'Resend Link'}
              </button>
              <button
                onClick={() => { setGeneralError(null); setStep('form'); setMode('login'); }}
                className="w-full text-center text-sm font-medium text-slate-500 hover:text-primary transition-colors py-2"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default AuthModal;
