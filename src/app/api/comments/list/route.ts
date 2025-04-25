// FULL CODE: app/api/comments/list/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { getIronSession, type IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session'; // Adjust path if needed

// Define the expected structure of a comment coming from the IG API
// including the nested user object for the profile picture
interface InstagramComment {
    id: string;
    text: string;
    timestamp: string;
    username: string;
    user?: { // User object might not always be present depending on permissions/privacy
        id: string; // App-scoped ID of the commenter
        profile_picture_url?: string; // The field we need
    };
    // Add other fields like 'like_count' if needed
}

// Define the structure of the API response for comments
interface InstagramCommentResponse {
    data?: InstagramComment[]; // Comments are in the 'data' array
    paging?: {
        cursors?: {
            after?: string;
            before?: string;
        };
        next?: string; // URL for next page
    };
    error?: { // Structure for potential errors from IG API
        message: string;
        type: string;
        code: number;
        error_subcode?: number;
        fbtrace_id: string;
    };
}


export async function GET(request: NextRequest) {
    console.log("API Route /api/comments/list: Received request");

    // 1. Check Session and Authentication
    const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
    const token = session.ig_access_token;
    const loggedInUserId = session.ig_user_id; // Logged-in user's IBID

    if (!token || !loggedInUserId) {
        console.log("API Route /api/comments/list: Unauthorized - No token or user ID in session.");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`API Route /api/comments/list: Authenticated as user ${loggedInUserId}`);

    // 2. Get Parameters from Request URL
    const searchParams = request.nextUrl.searchParams;
    const mediaId = searchParams.get('mediaId');
    const afterCursor = searchParams.get('after'); // For pagination

    console.log(`API Route /api/comments/list: mediaId='${mediaId}', after='${afterCursor}'`);

    // 3. Validate Required Parameters
    if (!mediaId) {
        console.error("API Route /api/comments/list: Bad Request - Missing mediaId parameter.");
        // Returning the 400 error you saw
        return NextResponse.json({ error: 'Missing mediaId parameter' }, { status: 400 });
    }

    // 4. Construct Instagram Graph API URL
    // Request commenter's username and profile picture using field expansion
    const fields = 'id,text,timestamp,username,user{id,profile_picture_url}';
    const limit = 50; // Request a reasonable limit per page

    let apiUrl = `https://graph.instagram.com/${mediaId}/comments?fields=${fields}&limit=${limit}&access_token=${token}`;
    if (afterCursor) {
        apiUrl += `&after=${encodeURIComponent(afterCursor)}`; // Ensure cursor is encoded
    }

    // Log the URL carefully, hiding the token
    const loggedApiUrl = apiUrl.replace(token, "[USER_ACCESS_TOKEN]");
    console.log("API Route /api/comments/list: Calling Instagram API:", loggedApiUrl);

    // 5. Make the API Call to Instagram
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            cache: 'no-store' // Comments change frequently, avoid caching
        });

        // Log status immediately
        console.log(`API Route /api/comments/list: Instagram API response status: ${response.status}`);

        // Attempt to parse JSON regardless of status for error details
        const data: InstagramCommentResponse = await response.json();

        // 6. Handle Instagram API Errors
        if (!response.ok || data.error) {
            const errorMessage = data.error?.message || `Instagram API Error (Status: ${response.status})`;
            const errorCode = data.error?.code || response.status;
            console.error(`API Route /api/comments/list: Instagram API Error fetching comments: ${errorMessage} (Code: ${errorCode})`, data.error);
            // Return a specific error structure and status code from IG if possible
            return NextResponse.json({ error: `Failed to fetch comments: ${errorMessage}` }, { status: errorCode >= 400 && errorCode < 500 ? errorCode : 500 });
        }

        // 7. Process Successful Response
        const comments = (data.data || []).map((comment: InstagramComment) => ({
            id: comment.id,
            text: comment.text,
            timestamp: comment.timestamp,
            username: comment.username,
            // Safely access nested profile picture URL
            profile_picture_url: comment.user?.profile_picture_url ?? undefined
        }));

        // Extract pagination cursor for the next page
        const nextCursor = data.paging?.cursors?.after;

        console.log(`API Route /api/comments/list: Successfully fetched ${comments.length} comments. Next cursor: ${nextCursor ? '[present]' : '[none]'}`);

        // 8. Return Formatted Data to Client
        return NextResponse.json({
            comments: comments,
            paging: { // Return structure consistent with what CommentFetcher expects
                after: nextCursor
            }
        });

    } catch (error) {
        // Handle network errors or other unexpected issues during fetch
        console.error("API Route /api/comments/list: Server error calling Instagram comments endpoint:", error);
        const message = error instanceof Error ? error.message : 'Unknown server error';
        return NextResponse.json({ error: `Server error fetching comments: ${message}` }, { status: 500 });
    }
}