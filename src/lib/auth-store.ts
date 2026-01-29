/**
 * Enterprise Auth Store
 * Secure user management with encrypted password storage
 */

import { hashPassword, verifyPassword, uuid, generateSessionToken } from './crypto-utils';

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

interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

interface Session {
  userId: string;
  token: string;
  expiresAt: number;
}

// ============================================================================
// Storage Keys
// ============================================================================

const USERS_STORAGE_KEY = 'roi_enterprise_users';
const SESSION_STORAGE_KEY = 'roi_enterprise_session';
const WAITLIST_STORAGE_KEY = 'roi_enterprise_waitlist';

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// ============================================================================
// User Storage
// ============================================================================

function getStoredUsers(): StoredUser[] {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function findUserByEmail(email: string): StoredUser | undefined {
  const users = getStoredUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function findUserById(id: string): StoredUser | undefined {
  const users = getStoredUsers();
  return users.find(u => u.id === id);
}

// ============================================================================
// Session Management
// ============================================================================

function getSession(): Session | null {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;

    const session: Session = JSON.parse(stored);

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

function createSession(userId: string): Session {
  const session: Session = {
    userId,
    token: generateSessionToken(),
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

// ============================================================================
// Auth Operations
// ============================================================================

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Register a new user
 */
export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  // Check if email already exists
  if (findUserByEmail(email)) {
    return {
      success: false,
      error: 'An account with this email already exists',
    };
  }

  // Hash password using PBKDF2
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  const newUser: StoredUser = {
    id: uuid(),
    email: email.toLowerCase().trim(),
    name: name.trim(),
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  // Save user
  const users = getStoredUsers();
  users.push(newUser);
  saveStoredUsers(users);

  // Create session
  createSession(newUser.id);

  return {
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      isVerified: true,
      createdAt: newUser.createdAt,
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
  const storedUser = findUserByEmail(email);

  if (!storedUser) {
    // Use generic error to prevent user enumeration
    return {
      success: false,
      error: 'Invalid email or password',
    };
  }

  // Verify password
  const isValid = await verifyPassword(password, storedUser.passwordHash);

  if (!isValid) {
    return {
      success: false,
      error: 'Invalid email or password',
    };
  }

  // Create session
  createSession(storedUser.id);

  return {
    success: true,
    user: {
      id: storedUser.id,
      email: storedUser.email,
      name: storedUser.name,
      isVerified: true,
      createdAt: storedUser.createdAt,
    },
  };
}

/**
 * Get current logged-in user
 */
export function getCurrentUser(): User | null {
  const session = getSession();
  if (!session) return null;

  const storedUser = findUserById(session.userId);
  if (!storedUser) {
    clearSession();
    return null;
  }

  return {
    id: storedUser.id,
    email: storedUser.email,
    name: storedUser.name,
    isVerified: true,
    createdAt: storedUser.createdAt,
  };
}

/**
 * Logout current user
 */
export function logoutUser(): void {
  clearSession();
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  return getSession() !== null;
}

/**
 * Refresh session (extend expiry)
 */
export function refreshSession(): boolean {
  const session = getSession();
  if (!session) return false;

  session.expiresAt = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return true;
}

// ============================================================================
// Waitlist
// ============================================================================

export function addToWaitlist(email: string): boolean {
  try {
    const stored = localStorage.getItem(WAITLIST_STORAGE_KEY);
    const waitlist: string[] = stored ? JSON.parse(stored) : [];

    const normalizedEmail = email.toLowerCase().trim();

    if (waitlist.includes(normalizedEmail)) {
      return true; // Already on waitlist
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
