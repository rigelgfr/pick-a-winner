// components/CommentFetcher.tsx
"use client";

import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';

// Interface for the structure of a single comment expected from the API
export interface Comment {
    id: string;
    text: string;
    timestamp: string;
    username: string;
    profile_picture_url?: string;
}

// Interface for pagination cursors from the API
interface PagingCursors {
    after?: string;
}

// Props the component receives from its parent (PickerUI)
interface CommentFetcherProps {
    mediaId: string | null; // The ID of the post to fetch comments for (or null if none selected)
    onError: (error: string | null) => void; // Callback function to report errors to the parent
    onPageFetched?: (fetchedCount: number, firstCommenter?: { username: string; profile_picture_url?: string }) => void; // Optional callback for progress/animation
}

// Defines the methods that the parent component can call via the ref
export interface CommentFetcherRef {
    fetchAllComments: () => Promise<Comment[] | null>; // Returns all comments or null on error
}

const CommentFetcher = forwardRef<CommentFetcherRef, CommentFetcherProps>(
    ({ mediaId, onError, onPageFetched }, ref) => {

        // Internal state to track if a page is currently being fetched (prevents duplicate calls)
        const [internalIsLoadingPage, setInternalIsLoadingPage] = useState(false);

        // This hook exposes the fetchAllComments function to the parent component via the ref
        useImperativeHandle(ref, () => ({
            // This is the function the parent calls when the "Pick Winner" button is clicked
            async fetchAllComments(): Promise<Comment[] | null> {
                console.log(`CommentFetcher.fetchAllComments called. mediaId prop: ${mediaId}`);

                // --- Guard Clauses ---
                if (!mediaId) {
                    console.error("fetchAllComments called without mediaId.");
                    onError("No post selected to fetch comments from."); // Notify parent
                    return null; // Indicate failure
                }
                if (internalIsLoadingPage) {
                    console.warn("fetchAllComments called while already fetching a page.");
                    // Optionally inform the parent, or just prevent re-entry
                    // onError("Already fetching comments, please wait.");
                    return null;
                }
                // --- End Guard Clauses ---

                console.log(`Ref Triggered: Starting fetch for all comments for mediaId: ${mediaId}`);
                onError(null); // Clear any previous error in the parent

                // --- State for the fetch loop ---
                let accumulatedComments: Comment[] = [];
                let currentCursor: string | undefined = undefined;
                let hasNextPage = true;
                const MAX_COMMENT_PAGES = 50; // Safety limit to prevent infinite loops
                let pagesFetched = 0;
                // --- End State for the fetch loop ---

                // --- Pagination Loop ---
                while (hasNextPage && pagesFetched < MAX_COMMENT_PAGES) {
                    pagesFetched++;
                    setInternalIsLoadingPage(true); // Mark as loading this specific page

                    // --- Construct the API URL ---
                    // CRITICAL: Ensure mediaId is correctly included here
                    let url = `/api/comments/list?mediaId=${mediaId}`;
                    if (currentCursor) {
                        url += `&after=${encodeURIComponent(currentCursor)}`;
                    }
                    // --- End URL Construction ---

                    console.log(`CommentFetcher Fetching URL: ${url}`); // Log the URL before fetch
                    console.log(`Fetching comment page ${pagesFetched}...`);

                    try {
                        // --- Perform the fetch ---
                        const response = await fetch(url);
                        const data = await response.json(); // Assume JSON, handle potential errors below

                        // --- Handle API Errors ---
                        if (!response.ok) {
                            // Extract error message from response data if possible
                            const errorMsg = data?.error || `Failed to fetch comments page ${pagesFetched}: ${response.statusText}`;
                            throw new Error(errorMsg); // Throw to be caught by catch block
                        }
                        // --- End Handle API Errors ---

                        // --- Process Success Response ---
                        const newComments: Comment[] = data.comments || [];
                        accumulatedComments = [...accumulatedComments, ...newComments];
                        currentCursor = data.paging?.after; // Get cursor for the *next* page
                        hasNextPage = !!currentCursor; // Check if there's a next page cursor

                        console.log(`Page ${pagesFetched}: Fetched ${newComments.length} comments. Total: ${accumulatedComments.length}. HasNext: ${hasNextPage}`);

                        // --- Call Progress Callback (if provided) ---
                        if (onPageFetched && newComments.length > 0) {
                            onPageFetched(
                                accumulatedComments.length,
                                {
                                    username: newComments[0].username,
                                    profile_picture_url: newComments[0].profile_picture_url
                                }
                            );
                        }
                        // --- End Progress Callback ---

                    } catch (err) {
                        // --- Handle Fetch/Processing Errors for this page ---
                        const errorMsg = err instanceof Error ? err.message : 'Failed to load comments page';
                        console.error(`Error fetching comment page ${pagesFetched}:`, err);
                        onError(errorMsg); // Report error to parent
                        setInternalIsLoadingPage(false); // Stop loading indicator
                        return null; // Return null to indicate overall failure
                        // --- End Handle Fetch/Processing Errors ---
                    } finally {
                        // Mark page loading as finished (even if the loop continues)
                        setInternalIsLoadingPage(false);
                    }
                } // --- End Pagination Loop ---

                // --- Check if loop ended due to page limit ---
                if (pagesFetched >= MAX_COMMENT_PAGES) {
                    console.warn(`Stopped fetching comments after reaching limit of ${MAX_COMMENT_PAGES} pages.`);
                    // Depending on requirements, you might want to notify the user
                    // onError(`Reached maximum fetch limit (${MAX_COMMENT_PAGES} pages). Results may be incomplete.`);
                }
                // --- End Check ---

                console.log(`Finished fetching all comments. Total: ${accumulatedComments.length}`);
                return accumulatedComments; // Return the final accumulated list
            }
        })); // End useImperativeHandle

        // --- Component Rendering ---
        // This component itself doesn't need to render anything visible.
        // Its purpose is to provide the fetchAllComments function via the ref.
        // You could render a status indicator for debugging if needed.
        // if (internalIsLoadingPage) { console.log("CommentFetcher is loading a page..."); }
        return null;
        // --- End Component Rendering ---
    }
);

// Add display name for better debugging in React DevTools
CommentFetcher.displayName = "CommentFetcher";

export default CommentFetcher;