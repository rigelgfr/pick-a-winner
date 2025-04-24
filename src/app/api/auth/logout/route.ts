// app/api/auth/logout/route.ts
import { cookies } from 'next/headers';
import { getIronSession, type IronSessionData } from 'iron-session';
import { sessionOptions } from '@/lib/session'; // Adjust path if needed
import { NextResponse } from 'next/server';

// Use POST or DELETE for actions that change state like logout
export async function POST() {
    try {
        const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
        session.destroy(); // Destroy the session data

        console.log('Session destroyed (logout)');

        // Respond to the client indicating success
        // Optionally clear the cookie explicitly, though destroy usually handles it.
        // You might still need to pass options if the cookie has specific path/domain
         const response = NextResponse.json({ success: true });
        // Setting Max-Age=0 effectively deletes the cookie immediately
        response.cookies.set(sessionOptions.cookieName, '', { maxAge: 0, path: '/' });
        return response;

    } catch (error) {
        console.error("Error during logout:", error);
        return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 });
    }
}