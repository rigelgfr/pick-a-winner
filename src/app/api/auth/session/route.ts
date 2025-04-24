// app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { getIronSession, type IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type UserProfile } from '@/lib/session'; // Import UserProfile

// Define the expected structure from the Graph API /me endpoint
interface InstagramMeResponse {
    id: string;
    username: string;
    profile_picture_url?: string; // This is the field we need
    error?: { message: string };
}

export async function GET() {
    console.log("API Route /api/auth/session: Checking session...");
    try {
        const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
        const { ig_access_token, ig_user_id } = session;

        if (!ig_access_token || !ig_user_id) {
            console.log("API Route /api/auth/session: No token/ID found in session.");
            return NextResponse.json({ isLoggedIn: false, user: null });
        }

        console.log("API Route /api/auth/session: Token/ID found, fetching profile from IG...");

        // --- Fetch user profile from Instagram Graph API ---
        try {
            const fields = 'id,username,profile_picture_url'; // Ensure profile_picture_url is requested
            const userApiUrl = `https://graph.instagram.com/me?fields=${fields}&access_token=${ig_access_token}`;

            const userResponse = await fetch(userApiUrl, { cache: 'no-store' }); // Don't cache heavily

            if (!userResponse.ok) {
                 // Attempt to parse error from Instagram
                 const errorBody = await userResponse.text();
                 let errorMessage = `Instagram API error (Status: ${userResponse.status})`;
                 try {
                     const errorJson = JSON.parse(errorBody);
                     errorMessage = errorJson?.error?.message || errorMessage;
                 } catch { /* Ignore parsing error, use default message */ }

                 console.error(`API Route /api/auth/session: Failed to fetch IG profile. ${errorMessage}`, errorBody);
                 // If fetching fails (e.g., token expired), treat user as logged out
                 // Optionally: Destroy session here? No, cannot modify cookies easily in GET.
                 return NextResponse.json({ isLoggedIn: false, user: null });
            }

            const userData: InstagramMeResponse = await userResponse.json();
            console.log("API Route /api/auth/session: Successfully fetched IG profile for", userData.username);

            // Prepare the user profile object to return
            const userProfile: UserProfile = {
                id: String(userData.id), // Use the ID from /me
                username: userData.username,
                profile_picture_url: userData.profile_picture_url,
            };

            return NextResponse.json({ isLoggedIn: true, user: userProfile });

        } catch (fetchError) {
            console.error("API Route /api/auth/session: Network/fetch error getting IG profile:", fetchError);
            // Network error, treat as logged out for safety
             return NextResponse.json({ isLoggedIn: false, user: null });
        }
        // --- End Fetch user profile ---

    } catch (error) {
        console.error("API Route /api/auth/session: Error accessing session:", error);
        return NextResponse.json({ isLoggedIn: false, user: null }, { status: 500 });
    }
}