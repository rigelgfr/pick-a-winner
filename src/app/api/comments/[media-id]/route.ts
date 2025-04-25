// app/api/comments/[mediaId]/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { getIronSession, type IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session'; // Adjust path

// Define structure for a single comment and the API response
interface IgComment {
    id: string;
    text: string;
    timestamp: string;
    username: string;
    user?: { id: string }; // User who commented (basic info)
    // Add other fields if needed (like 'like_count', 'replies')
}

interface CommentsApiResponse {
    data: IgComment[];
    paging?: {
        cursors?: {
            after?: string;
            before?: string;
        };
        next?: string;
    };
    error?: any; // To catch potential errors in the response body
}

// Route Handler context includes params
export async function GET(
    request: NextRequest,
    { params }: { params: { mediaId: string } }
) {
    const mediaId = params.mediaId; // Get mediaId from the URL path

    if (!mediaId) {
        return NextResponse.json({ error: 'Missing Media ID' }, { status: 400 });
    }

    console.log(`API: Fetching comments for Media ID: ${mediaId}`);

    const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
    const token = session.ig_access_token;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allComments: IgComment[] = [];
    let nextCursor: string | undefined = undefined;
    let hasNextPage = true;
    const fields = 'id,text,timestamp,username,user'; // Request desired comment fields
    const limit = 50; // Fetch max allowed per page
    let pageCount = 0;
    const MAX_PAGES = 30; // Safety limit (e.g., 30 * 50 = 1500 comments)

    try {
        while (hasNextPage && pageCount < MAX_PAGES) {
            pageCount++;
            let apiUrl = `https://graph.instagram.com/${mediaId}/comments?fields=${fields}&limit=${limit}&access_token=${token}`;
            if (nextCursor) {
                apiUrl += `&after=${nextCursor}`;
            }

            console.log(`API: Fetching comment page ${pageCount} for ${mediaId}...`);
            const response = await fetch(apiUrl, { cache: 'no-store' });
            const data: CommentsApiResponse = await response.json();

            if (!response.ok || data.error) {
                console.error("API: IG Error fetching comments:", data.error || `Status: ${response.status}`);
                throw new Error(`Failed to fetch comments: ${data?.error?.message || response.statusText}`);
            }

            const commentsOnPage = data.data || [];
            allComments.push(...commentsOnPage);
            console.log(`API: Fetched ${commentsOnPage.length} comments, total now ${allComments.length}`);

            // --- Get next cursor ---
            // Prefer using the 'after' cursor directly if available
            nextCursor = data.paging?.cursors?.after;
            hasNextPage = !!nextCursor; // Continue if there's an 'after' cursor

            if (!hasNextPage) {
                 console.log(`API: No more pages of comments for ${mediaId}.`);
            }

             // Optional: Add a small delay between requests to avoid potential rate limits
            // if (hasNextPage) {
            //    await new Promise(resolve => setTimeout(resolve, 250)); // 250ms delay
            // }
        } // End while loop

        if (pageCount >= MAX_PAGES && hasNextPage) {
             console.warn(`API: Reached MAX_PAGES limit (${MAX_PAGES}) for comments on ${mediaId}. Returning ${allComments.length} comments found so far.`);
             // Optionally return an indication that results might be incomplete
        }

        console.log(`API: Finished fetching comments for ${mediaId}. Total: ${allComments.length}`);
        return NextResponse.json({ comments: allComments });

    } catch (error) {
        console.error(`API: Error fetching comments for ${mediaId}:`, error);
        const message = error instanceof Error ? error.message : 'Server error fetching comments';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}