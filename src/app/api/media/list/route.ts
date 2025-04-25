// app/api/media/list/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getIronSession, type IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';

export async function GET(request: NextRequest) {
    const session = await getIronSession<IronSessionData>(await cookies(), sessionOptions);
    const token = session.ig_access_token;
    const userId = session.ig_user_id; // This should be the IBID

    if (!token || !userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '4';
    const after = searchParams.get('after');

    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,shortcode,timestamp';
    let apiUrl = `https://graph.instagram.com/${userId}/media?fields=${fields}&limit=${limit}&access_token=${token}`;
    if (after) {
        apiUrl += `&after=${after}`;
    }

    try {
        const response = await fetch(apiUrl, { cache: 'no-store' });
        if (!response.ok) {
            const errorData = await response.json();
            console.error("IG API Error fetching media:", errorData);
            return NextResponse.json({ error: `Failed to fetch Instagram media: ${errorData?.error?.message || response.statusText}` }, { status: response.status });
        }
        const data = await response.json();

        return NextResponse.json({
            posts: data.data || [],
            paging: data.paging?.cursors || {} // Return the cursors object
        });

    } catch (error) {
        console.error("Error calling IG media endpoint:", error);
        return NextResponse.json({ error: 'Server error fetching media' }, { status: 500 });
    }
}