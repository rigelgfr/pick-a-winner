// components/SearchByUrl.tsx
"use client";
import React, { useState } from 'react';

export interface FoundPost { // Define structure of what the search returns
    id: string;
    display_url?: string;
    caption?: string;
    timestamp: string;
    like_count: number;
    comments_count: number;
    shortcode: string; // Good to have for reference
}

// Props for the component
interface SearchByUrlProps {
    onPostFound: (postData: FoundPost | null) => void; // Callback with detailed data or null
    onSearchStart: () => void; // Callback when search begins
    onSearchEnd: (error?: string) => void; // Callback when search finishes (with optional error)
    disabled?: boolean; // Allow parent to disable
}

const SearchByUrlBar: React.FC<SearchByUrlProps> = ({
    onPostFound,
    onSearchStart,
    onSearchEnd,
    disabled = false
}) => {
    const [url, setUrl] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        onSearchStart(); // Notify parent that search is starting
        onPostFound(null); // Clear previous results in parent

        try {
            const response = await fetch(`/api/media/search?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Search failed: ${response.statusText}`);
            }

            if (data.post) {
                onPostFound(data.post); // Pass full post data up
                onSearchEnd(); // Notify search ended successfully
            } else {
                // Should not happen if API returns 404 correctly, but handle just in case
                onSearchEnd('Post data not found in response.');
            }

        } catch (err) {
             const errorMsg = err instanceof Error ? err.message : 'Search failed.';
             console.error("Error searching by URL:", err);
             onSearchEnd(errorMsg); // Notify search ended with error
        }
    };

    return (
        <div>
            <h3>Find Post by URL</h3>
            <form onSubmit={handleSearch}>
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter Instagram Post URL (e.g., https://www.instagram.com/p/...)"
                    required
                    style={{ width: '80%', marginRight: '10px', padding: '8px' }}
                    disabled={disabled} // Use disabled prop
                />
                <button type="submit" disabled={disabled}> {/* Use disabled prop */}
                     Search {/* Loading state is managed by parent now */}
                </button>
            </form>
            {/* Error display is now handled by the parent component */}
        </div>
    );
};

export default SearchByUrlBar;