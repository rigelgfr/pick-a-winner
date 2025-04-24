// app/api/auth/start/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sealState, getStateCookieOptions } from '@/lib/session';

export async function GET() { // Use GET as it just retrieves the URL
    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI; // Ensure this is set correctly (ngrok or prod)

    if (!clientId || !redirectUri) {
        console.error('Missing Instagram config for auth start');
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    try {
        // 1. Generate secure random state
        const state = crypto.randomBytes(16).toString('hex');

        // 2. Seal the state for the cookie
        const sealedState = await sealState(state);

        // 3. Construct the Instagram Authorization URL with state
        const scopes = [
            'instagram_business_basic',
            'instagram_business_manage_comments',
        ];
        const scopeString = scopes.join(',');
        const authUrl = new URL('https://www.instagram.com/oauth/authorize');
        authUrl.searchParams.append('client_id', clientId);
        authUrl.searchParams.append('redirect_uri', redirectUri);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('scope', scopeString);
        authUrl.searchParams.append('state', state); // Add the state parameter
        authUrl.searchParams.append('enable_fb_login', '0');
        authUrl.searchParams.append('force_authentication', '1');

        // 4. Prepare the response (JSON with the URL)
        const response = NextResponse.json({ authorizationUrl: authUrl.toString() });

        // 5. Set the state cookie on the response
        response.cookies.set({
            ...getStateCookieOptions(), // Get name, path, httpOnly, secure, maxAge etc.
            value: sealedState,
        });

        return response;

    } catch (error) {
        console.error("Error starting auth flow:", error);
        return NextResponse.json({ error: 'Failed to initiate login.' }, { status: 500 });
    }
}