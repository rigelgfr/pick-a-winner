// app/api/comments/details/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getIronSession, type IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';

// Clear interface for Instagram comment responses
export interface InstagramCommentResponse {
    id: string;
    text?: string;
    timestamp?: string;
    from: {
        id: string;
        username?: string;
    };
    error?: { 
        message: string;
        code: number;
    };
}

export async function GET(request: NextRequest) {
    console.log("API Route /api/comments/details: Received request");

    // 1. Validate session
    const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
    const token = session.ig_access_token;
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get commentId from query parameters
    const searchParams = request.nextUrl.searchParams;
    const commentId = searchParams.get('commentId');
    console.log(`API Route /api/comments/details: commentId='${commentId}'`);

    // 3. Validate required parameters
    if (!commentId) {
        console.error("API Route /api/comments/details: Bad Request - Missing commentId parameter.");
        return NextResponse.json({ error: 'Missing commentId parameter' }, { status: 400 });
    }

    // 4. Construct Instagram Graph API URL
    const fields = 'id,text,timestamp,from';
    const apiUrl = `https://graph.instagram.com/${commentId}?fields=${fields}&access_token=${token}`;
    const loggedApiUrl = apiUrl.replace(token, "[USER_ACCESS_TOKEN]");
    console.log("API Route /api/comments/details: Calling Instagram API:", loggedApiUrl);

    // 5. Make the API Call
    try {
        const response = await fetch(apiUrl, { method: 'GET', cache: 'no-store' });
        console.log(`API Route /api/comments/details: Instagram API response status: ${response.status}`);
        const data: InstagramCommentResponse = await response.json();

        // 6. Handle API errors
        if (!response.ok || data.error) {
            const errorMessage = data.error?.message || `Instagram API Error (Status: ${response.status})`;
            const errorCode = data.error?.code || response.status;
            console.error(`API Route /api/comments/details: Instagram API Error: ${errorMessage}`, data.error);
            return NextResponse.json(
                { error: `Failed to fetch comment details: ${errorMessage}` }, 
                { status: errorCode >= 400 && errorCode < 500 ? errorCode : 500 }
            );
        }

        // 7. Return successful response
        console.log("API Route /api/comments/details: Successfully fetched comment details");
        return NextResponse.json(data);

    } catch (error) {
        // Handle unexpected errors
        console.error("API Route /api/comments/details: Server error:", error);
        const message = error instanceof Error ? error.message : 'Unknown server error';
        return NextResponse.json({ error: `Server error fetching comment details: ${message}` }, { status: 500 });
    }
}