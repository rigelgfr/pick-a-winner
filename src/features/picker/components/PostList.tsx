// components/PickerUI.tsx or components/PostList.tsx
"use client"; // Assuming this part needs interaction

import React, { useState, useEffect, useCallback } from 'react';
// ... other imports

interface MediaItem {
    id: string;
    caption?: string;
    media_type: string; // IMAGE, VIDEO, CAROUSEL_ALBUM
    media_url?: string;
    thumbnail_url?: string; // Important for videos
    permalink: string;
    shortcode: string;
    timestamp: string;
}

interface PagingCursors {
    after?: string;
    before?: string; // Less common to use
}

const PostLoader: React.FC<{ userId: string /* Pass the IBID */ }> = ({ userId }) => {
    const [posts, setPosts] = useState<MediaItem[]>([]);
    const [paging, setPaging] = useState<PagingCursors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = useCallback(async (afterCursor?: string) => {
        setIsLoading(true);
        setError(null);
        // Construct URL: Use an API route to hide token/make call server-side
        let url = `/api/media/list?limit=4`; // Example API route
        if (afterCursor) {
            url += `&after=${encodeURIComponent(afterCursor)}`;
        }

        try {
            const response = await fetch(url); // Fetch from your backend
            if (!response.ok) {
                throw new Error(`Failed to fetch posts: ${response.statusText}`);
            }
            const data = await response.json();

            setPosts(prev => afterCursor ? [...prev, ...data.posts] : data.posts);
            setPaging(data.paging || {}); // Update paging cursor

        } catch (err) {
            console.error("Error fetching posts:", err);
            setError(err instanceof Error ? err.message : 'Failed to load posts');
        } finally {
            setIsLoading(false);
        }
    }, []); // Dependencies needed if userId changes, etc.

    // Initial fetch
    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleLoadMore = () => {
        if (paging.after) {
            fetchPosts(paging.after);
        }
    };

    return (
        <div>
            <h3>Your Recent Posts</h3>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                {posts.map(post => (
                    <div key={post.id} style={{border: '1px solid #ccc', padding: '5px'}}>
                        <img
                            src={post.thumbnail_url || post.media_url}
                            alt={post.caption?.substring(0, 50) || 'Instagram Post'}
                            style={{ width: '100%', height: '150px', objectFit: 'cover', cursor: 'pointer' }}
                            // TODO: Add onClick handler to select this post
                        />
                         {/* Optionally display caption, timestamp etc */}
                    </div>
                ))}
            </div>
            {isLoading && <p>Loading posts...</p>}
            {paging.after && !isLoading && (
                <button onClick={handleLoadMore} style={{marginTop: '10px'}}>Load More</button>
            )}
             {!paging.after && !isLoading && posts.length > 0 && <p>No more posts.</p>}
             {!isLoading && posts.length === 0 && !error && <p>No posts found.</p>}
        </div>
    );
};

export default PostLoader;