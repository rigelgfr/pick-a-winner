// app/api/auth/instagram/callback/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getIronSession, type IronSessionData } from 'iron-session'; // Import IronSessionData from the library itself
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session'; // Import only options
import { unsealState, getStateCookieOptions } from '@/lib/session'; // State helpers

// --- Environment Variables ---
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;

interface TokenResponse { // Simplified interface based on ACTUAL response
  access_token: string;
  user_id: number | string; // User ID might be number or string
  permissions?: string[]; // Optional permissions
}

interface LongLivedTokenResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

interface InstagramErrorDetail {
  message: string;
  type: string;
  code: number;
  fbtrace_id?: string;
}

interface InstagramErrorResponse {
  error?: InstagramErrorDetail; // Nested error object structure
  // Sometimes error is top-level
  error_type?: string;
  code?: number;
  error_message?: string;
}

// Combined type for better error handling
export type InstagramError = InstagramErrorDetail | InstagramErrorResponse;

// --- Route Handler (GET for the callback) ---
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  const receivedState = url.searchParams.get('state'); // Get state from query params
  const redirectBaseUrl = new URL('/picker', url.origin);

  // --- Get the state cookie ---
  const cookieStore = await cookies(); // Get cookie store instance
  const sealedStateFromCookie = cookieStore.get(getStateCookieOptions().name)?.value; // Use .get() directly

  // --- Unseal and immediately clear the state cookie ---
  const expectedState = await unsealState(sealedStateFromCookie);
  // Clear the state cookie *regardless* of validity - it's single use
  if (sealedStateFromCookie) {
    try {
      cookieStore.delete(getStateCookieOptions().name);
      console.log("Callback: State cookie deleted successfully via delete()");

    } catch (deleteError) {
        console.error("Callback: Error deleting state cookie:", deleteError);
    }
  }

  // --- State Validation ---
  if (!receivedState || !expectedState || receivedState !== expectedState) {
    console.error('Invalid OAuth state received.', { received: receivedState, expected: expectedState });
    const redirectUrl = new URL('/picker', request.nextUrl.origin);
    redirectUrl.searchParams.set('error', 'Invalid login attempt (state mismatch). Please try again.');
    return NextResponse.redirect(redirectUrl.toString()); // Redirect with error
  }
  console.log("OAuth state validated successfully.");

  // --- Error/Code Checks (keep these as before) ---
   if (error) {
    console.error('Instagram Login Error:', { error, errorDescription });
    redirectBaseUrl.searchParams.set('error', errorDescription || 'Login failed');
    return NextResponse.redirect(redirectBaseUrl);
  }
  if (!code) {
     console.error('Missing authorization code from Instagram');
     redirectBaseUrl.searchParams.set('error', 'Missing authorization code');
     return NextResponse.redirect(redirectBaseUrl);
   }
   if (!INSTAGRAM_CLIENT_ID || !INSTAGRAM_CLIENT_SECRET || !INSTAGRAM_REDIRECT_URI) {
     console.error('Missing server-side Instagram environment variables');
     redirectBaseUrl.searchParams.set('error', 'Server configuration error');
     return NextResponse.redirect(redirectBaseUrl);
   }
  // --- End Checks ---

  try {
    // --- Step 2 & 3: Token Exchange (keep fetch logic as before) ---
    const tokenFormData = new FormData();
    tokenFormData.append('client_id', INSTAGRAM_CLIENT_ID!);
    tokenFormData.append('client_secret', INSTAGRAM_CLIENT_SECRET!);
    tokenFormData.append('grant_type', 'authorization_code');
    tokenFormData.append('redirect_uri', INSTAGRAM_REDIRECT_URI!);
    tokenFormData.append('code', code.replace(/#_$/, ''));

    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        body: tokenFormData,
    });
    const tokenData: TokenResponse | InstagramErrorResponse = await tokenResponse.json();

    console.log("Instagram Token Exchange Response Status:", tokenResponse.status);
    console.log("Instagram Token Exchange Response Body:", JSON.stringify(tokenData, null, 2));

    if (!tokenResponse.ok || !('access_token' in tokenData) || !tokenData.access_token) {
      const errorDetails = (tokenData as InstagramErrorResponse)?.error || tokenData;
      const errorMessage = 
        'message' in errorDetails 
          ? errorDetails.message 
          : 'error_message' in errorDetails && errorDetails.error_message 
            ? errorDetails.error_message 
            : 'Unknown token exchange error';
      console.error('Failed to exchange code for token. Details:', errorDetails);
      throw new Error(`Token exchange failed: ${errorMessage}`);
    }

     const shortLivedToken = tokenData.access_token;
        // Ensure user_id is stored as a string for consistency
        const instagramUserId = String(tokenData.user_id);

        console.log("Successfully obtained short-lived token for user:", instagramUserId);

        // --- Step 3: Exchange Short-Lived Token for Long-Lived Token (Keep as before) ---
        const longLivedUrl = new URL('https://graph.instagram.com/access_token');
        longLivedUrl.searchParams.append('grant_type', 'ig_exchange_token');
        longLivedUrl.searchParams.append('client_secret', INSTAGRAM_CLIENT_SECRET!);
        longLivedUrl.searchParams.append('access_token', shortLivedToken);

        const longLivedResponse = await fetch(longLivedUrl.toString());
        const longLivedData: LongLivedTokenResponse | InstagramErrorResponse = await longLivedResponse.json();

        console.log("Instagram Long-Lived Token Exchange Response Status:", longLivedResponse.status);
        console.log("Instagram Long-Lived Token Exchange Response Body:", JSON.stringify(longLivedData, null, 2));


        if (!longLivedResponse.ok || !('access_token' in longLivedData)) {
            const errorDetails = (longLivedData as InstagramErrorResponse)?.error || longLivedData;
            const errorMessage = 
              'message' in errorDetails 
                ? errorDetails.message 
                : 'error_message' in errorDetails && errorDetails.error_message 
                  ? errorDetails.error_message 
                  : 'Unknown long-lived token error';
            console.error('Failed to exchange for long-lived token:', errorDetails);
            throw new Error(`Long-lived token exchange failed: ${errorMessage}`);
        }

        const longLivedToken = longLivedData.access_token;
        console.log("Successfully obtained long-lived token.");


        // --- Store Token and User ID in Session (Keep as before) ---
        const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
        session.ig_access_token = longLivedToken;
        session.ig_user_id = instagramUserId; // Store the string version
        await session.save();

        console.log('Instagram Login successful. Token stored in session.');

        const redirectUrl = new URL('/picker', request.nextUrl.origin); // Use the origin the request came from (the ngrok URL)

        const response = NextResponse.json({ success: true });
        response.headers.set('Location', redirectUrl.toString()); // Redirect to /picker on the SAME domain (ngrok)
        return new NextResponse(response.body, {
            status: 307, // Temporary Redirect
            headers: response.headers,
        });
    } catch (error) {
      console.error('Error during Instagram OAuth callback:', error);
      let errorMessage = 'An unexpected error occurred during login.';
      if (error instanceof Error) { errorMessage = error.message; }

      // Construct error redirect URL based on the origin
      const errorRedirectUrl = new URL('/picker', request.nextUrl.origin);
      errorRedirectUrl.searchParams.set('error', errorMessage);

      // Use the modified redirect approach for errors
      const errorResponse = NextResponse.json({ success: false, error: errorMessage });
      errorResponse.headers.set('Location', errorRedirectUrl.toString());
      return new NextResponse(errorResponse.body, {
          status: 307,
          headers: errorResponse.headers
      });
    }
}