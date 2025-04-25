// app/api/media/find-by-url/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getIronSession, type IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { FoundPost } from '@/features/picker/components/SearchByUrlBar';

// Helper to extract shortcode from various URL formats
function extractShortcode(url: string): string | null {
    try {
        const parsedUrl = new URL(url);
        // Match /p/SHORTCODE/ or /reel/SHORTCODE/ or /tv/SHORTCODE/
        const match = parsedUrl.pathname.match(/^\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    } catch (e) {
        return null; // Invalid URL
    }
}

// Helper function to search a specific endpoint (media or tags)
async function searchEndpointForShortcode(
    userId: string,
    token: string,
    targetShortcode: string
): Promise<FoundPost | null> {

    const fields = 'id,shortcode,media_url,thumbnail_url,caption,media_type,timestamp,like_count,comments_count';
    const limit = 100;
    let hasNextPage = true;
    let nextCursor: string | undefined = undefined;
    const MAX_PAGES = 5;
    let pagesFetched = 0;

    console.log(`Searching endpoint '/media' for shortcode: ${targetShortcode}`);

    while (hasNextPage && pagesFetched < MAX_PAGES) {
        pagesFetched++;
        let apiUrl = `https://graph.instagram.com/${userId}/media?fields=${fields}&limit=${limit}&access_token=${token}`;
        if (nextCursor) {
            apiUrl += `&after=${nextCursor}`;
        }
        console.log(`Fetching page ${pagesFetched} from /media...`);
        const response = await fetch(apiUrl, { cache: 'no-store' });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`IG API Error fetching /media:`, errorData);
            // Don't throw here, just stop searching this endpoint
            return null;
        }

        const data = await response.json();
        const items = data.data || [];

        for (const item of items) {
            if (item.shortcode === targetShortcode) {
                console.log(`Found matching post in /media: ${item.id}`);
                // --- Determine the best display URL ---
                let display_url = '';
                if (item.media_type === 'VIDEO' && item.thumbnail_url) {
                    display_url = item.thumbnail_url;
                } else if (item.media_url) {
                    // Note: media_url for non-video might expire, but usually works for short periods
                    display_url = item.media_url;
                }
                // --- End URL determination ---
                return {
                    id: item.id,
                    display_url: display_url, // Use the determined URL
                    caption: item.caption,
                    timestamp: item.timestamp,
                    like_count: item.like_count ?? 0, // Use nullish coalescing for safety
                    comments_count: item.comments_count ?? 0, // Use nullish coalescing
                    shortcode: item.shortcode
                };
            }
        }

        nextCursor = data.paging?.cursors?.after;
        hasNextPage = !!nextCursor;
        if (!hasNextPage) {
            console.log(`No more pages in /media.`);
        }
    }
    console.log(`Shortcode not found in /media after ${pagesFetched} pages.`);
    return null; // Not found in this endpoint
}

export async function GET(request: NextRequest) {
    const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
    const token = session.ig_access_token;
    const userId = session.ig_user_id; // IBID

    if (!token || !userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const postUrl = searchParams.get('url');

    if (!postUrl) {
        return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    const targetShortcode = extractShortcode(postUrl);

    if (!targetShortcode) {
         return NextResponse.json({ error: 'Invalid Instagram Post URL format' }, { status: 400 });
    }

    console.log(`Searching OWNED media for shortcode: ${targetShortcode} for user: ${userId}`);

    try {
        // --- Search ONLY owned media ---
        let foundPost = await searchEndpointForShortcode(userId!, token!, targetShortcode!);

        // --- Return result ---
        if (foundPost) {
            return NextResponse.json({ post: foundPost });
        } else {
            // Make the error message clearer
            return NextResponse.json({ error: 'Post not found in your owned media. Collab posts cannot be processed directly.' }, { status: 404 });
        }

    } catch (error) {
         console.error("Error during shortcode search:", error);
         const message = error instanceof Error ? error.message : 'Server error during search';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}