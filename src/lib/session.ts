import type { SessionOptions } from 'iron-session'; // Import SessionOptions directly
import { sealData, unsealData } from 'iron-session'; // Import sealing functions

declare module 'iron-session' {
  interface IronSessionData {
    ig_access_token?: string;
    ig_user_id?: string;
    // Add any other session data you might need here
  }
}

// Ensure SESSION_SECRET is set in .env.local and is at least 32 characters long
const sessionPassword = process.env.SESSION_SECRET;
if (!sessionPassword || sessionPassword.length < 32) {
  throw new Error(
    'SESSION_SECRET environment variable is required and must be at least 32 characters long.'
  );
}

export const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: 'pickawinner-ig-session', // Choose a unique name
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true, // Makes cookie inaccessible to client-side JavaScript
    sameSite: 'lax', // Helps prevent CSRF
    path: '/', // Recommended: Set cookie path to root
  },
};

// Basic type for user profile data (export this if used elsewhere)
export interface UserProfile {
  id: string;
  username: string;
  profile_picture_url?: string;
}

// --- Options for the temporary state cookie ---
const STATE_COOKIE_NAME = 'pickawinner-ig-state';
const stateCookieOptions: SessionOptions = {
  password: sessionPassword!, // Use the same strong password
  cookieName: STATE_COOKIE_NAME,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // Short duration: 10 minutes in seconds
  },
};

// Helper to seal state data into a cookie value
export async function sealState(state: string): Promise<string> {
  return sealData({ state }, { password: stateCookieOptions.password });
}

// Helper to unseal and verify state data from a cookie value
export async function unsealState(
  sealedState: string | undefined
): Promise<string | null> {
  if (!sealedState) return null;
  try {
    const data = await unsealData<{ state: string }>(sealedState, {
      password: stateCookieOptions.password,
      // Optional: set ttl to match maxAge if using ttl verification
      // ttl: stateCookieOptions.cookieOptions?.maxAge
    });
    return data.state;
  } catch (error) {
    console.error('Failed to unseal state cookie:', error);
    return null; // Invalid or expired seal
  }
}

// Helper to get the state cookie options for setting/deleting
export function getStateCookieOptions() {
    return {
        name: STATE_COOKIE_NAME,
        ...stateCookieOptions.cookieOptions // Spread the secure, httpOnly, path, etc.
    }
}