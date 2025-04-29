// app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { getIronSession, type IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type UserProfile } from '@/lib/session';

export async function GET() {
    console.log("API Route /api/auth/session: Checking session...");
    try {
        const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
        const { ig_access_token, ig_user_id, ig_username, ig_profile_picture } = session;

        if (!ig_access_token || !ig_user_id) {
            console.log("API Route /api/auth/session: No token/ID found in session.");
            return NextResponse.json({ isLoggedIn: false, user: null });
        }

        // Use the profile data that's already stored in the session
        if (ig_username) {
            console.log("API Route /api/auth/session: Using cached profile data for", ig_username);
            
            const userProfile: UserProfile = {
                id: ig_user_id,
                username: ig_username,
                profile_picture_url: ig_profile_picture,
            };

            return NextResponse.json({ isLoggedIn: true, user: userProfile });
        }

        // Fallback: If for some reason we don't have profile data cached
        // (shouldn't happen with the new implementation)
        console.log("API Route /api/auth/session: No cached profile data, fetching from IG...");
        
        try {
            const fields = 'id,username,profile_picture_url';
            const userApiUrl = `https://graph.instagram.com/me?fields=${fields}&access_token=${ig_access_token}`;

            const userResponse = await fetch(userApiUrl, { cache: 'no-store' });

            if (!userResponse.ok) {
                const errorBody = await userResponse.text();
                let errorMessage = `Instagram API error (Status: ${userResponse.status})`;
                try {
                    const errorJson = JSON.parse(errorBody);
                    errorMessage = errorJson?.error?.message || errorMessage;
                } catch { /* Ignore parsing error */ }

                console.error(`API Route /api/auth/session: Failed to fetch IG profile. ${errorMessage}`, errorBody);
                return NextResponse.json({ isLoggedIn: false, user: null });
            }

            const userData = await userResponse.json();
            console.log("API Route /api/auth/session: Successfully fetched IG profile for", userData.username);

            // Store this for future use (to avoid redundant calls)
            session.ig_username = userData.username;
            session.ig_profile_picture = userData.profile_picture_url;
            await session.save();

            const userProfile: UserProfile = {
                id: String(userData.id),
                username: userData.username,
                profile_picture_url: userData.profile_picture_url,
            };

            return NextResponse.json({ isLoggedIn: true, user: userProfile });

        } catch (fetchError) {
            console.error("API Route /api/auth/session: Network/fetch error getting IG profile:", fetchError);
            return NextResponse.json({ isLoggedIn: false, user: null });
        }

    } catch (error) {
        console.error("API Route /api/auth/session: Error accessing session:", error);
        return NextResponse.json({ isLoggedIn: false, user: null }, { status: 500 });
    }
}