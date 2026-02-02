/**
 * Auth Store — Supabase Auth wrapper
 */

import { supabase } from './supabase';

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  confirmEmail?: boolean;
}

// ============================================================================
// Auth Operations
// ============================================================================

/**
 * Register a new user (stores name in user_metadata)
 */
export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: 'Registration failed' };
  }

  // No session means email confirmation is required
  if (!data.session) {
    return {
      success: true,
      confirmEmail: true,
      user: {
        id: data.user.id,
        email: data.user.email ?? '',
        name: (data.user.user_metadata?.name as string) ?? '',
        isVerified: false,
        createdAt: data.user.created_at ?? new Date().toISOString(),
      },
    };
  }

  return {
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email ?? '',
      name: (data.user.user_metadata?.name as string) ?? '',
      isVerified: true,
      createdAt: data.user.created_at ?? new Date().toISOString(),
    },
  };
}

/**
 * Login user with email and password
 */
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: 'Login failed' };
  }

  return {
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email ?? '',
      name: (data.user.user_metadata?.name as string) ?? '',
      isVerified: true,
      createdAt: data.user.created_at ?? new Date().toISOString(),
    },
  };
}

/**
 * Logout current user
 */
export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Send password reset email via Supabase
 */
export async function sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  const redirectTo = `${window.location.origin}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Update password (used after password recovery)
 */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ============================================================================
// Waitlist (localStorage-based, unchanged)
// ============================================================================

const WAITLIST_STORAGE_KEY = 'roi_enterprise_waitlist';

export function addToWaitlist(email: string): boolean {
  try {
    const stored = localStorage.getItem(WAITLIST_STORAGE_KEY);
    const waitlist: string[] = stored ? JSON.parse(stored) : [];

    const normalizedEmail = email.toLowerCase().trim();

    if (waitlist.includes(normalizedEmail)) {
      return true;
    }

    waitlist.push(normalizedEmail);
    localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(waitlist));
    return true;
  } catch {
    return false;
  }
}

export function isOnWaitlist(email: string): boolean {
  try {
    const stored = localStorage.getItem(WAITLIST_STORAGE_KEY);
    const waitlist: string[] = stored ? JSON.parse(stored) : [];
    return waitlist.includes(email.toLowerCase().trim());
  } catch {
    return false;
  }
}
