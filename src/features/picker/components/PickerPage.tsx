'use client'

import type React from "react"
import type { UserProfile as UserProfileType } from "@/lib/session"
import { UserProfile } from "./UserProfile"
import CommentFetcher, { type CommentFetcherRef, type Comment } from './CommentFetcher';
import { useRef, useState } from "react";
import SearchByUrlBar, { FoundPost } from "./SearchByUrlBar";

interface PickerPageProps {
  user: UserProfileType
}

const PickerPage: React.FC<PickerPageProps> = ({ user }) => {
  // State for the found post details
  const [foundPostData, setFoundPostData] = useState<FoundPost | null>(null);
  // State to manage search loading/errors
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // --- States for Comment Fetching & Drawing ---
  const [isFetchingComments, setIsFetchingComments] = useState(false);
  const [commentFetchError, setCommentFetchError] = useState<string | null>(null);
  const [fetchedComments, setFetchedComments] = useState<Comment[]>([]);
  const [winner, setWinner] = useState<Comment | null>(null); // Single winner for now
  // State for loading animation hint
  const [loadingHint, setLoadingHint] = useState<{ count: number; user?: { username: string; profile_picture_url?: string }} | null>(null);

  // State for rules (keep as before)
  const [numWinners, setNumWinners] = useState(1);
  const [numMentions, setNumMentions] = useState(0);
  const [allowRepeats, setAllowRepeats] = useState(false);
  // --- Ref to trigger comment fetching ---
  // We use a ref to call a method on the CommentFetcher component instance
  const commentFetcherRef = useRef<CommentFetcherRef>(null);

  // --- Callbacks for SearchByUrl ---
  const handleSearchStart = () => {
    setIsSearching(true);
    setSearchError(null);
    setFoundPostData(null);
    setWinner(null); // Clear winner when searching new post
    setFetchedComments([]);
    setCommentFetchError(null);
    setIsFetchingComments(false);
    setLoadingHint(null);
  };

  const handleSearchEnd = (error?: string) => {
      setIsSearching(false);
      if (error) { setSearchError(error); }
  };

  const handlePostFound = (postData: FoundPost | null) => {
      setFoundPostData(postData);
  };
  // --- End Callbacks ---

  const handleClearSelection = () => {
      setFoundPostData(null);
      setIsSearching(false);
      setSearchError(null);
      setWinner(null);
      setFetchedComments([]);
      setCommentFetchError(null);
      setIsFetchingComments(false);
      setLoadingHint(null);
  };

  const handleCommentPageFetched = (
    totalCount: number,
    firstCommenter?: { username: string; profile_picture_url?: string }
  ) => {
    setLoadingHint({ count: totalCount, user: firstCommenter });
  };

  // --- Triggered by the "Pick Winner" button ---
  const handlePickWinner = async () => {
    if (!foundPostData || !commentFetcherRef.current) return;

    console.log(`Starting fetch and pick process for Post ID: ${foundPostData.id}`);
    setIsFetchingComments(true);
    setCommentFetchError(null);
    setWinner(null);
    setFetchedComments([]);
    setLoadingHint({ count: 0 });

    try {
        const allComments = await commentFetcherRef.current.fetchAllComments();

        if (allComments === null) {
            // Error during fetch, message already set by onError callback
            console.error("Comment fetching failed.");
            setIsFetchingComments(false);
            setLoadingHint(null);
            return;
        }

        console.log(`Successfully fetched ${allComments.length} comments.`); // Log the actual count fetched
        setLoadingHint(null);
        setFetchedComments(allComments);

        // --- ADD CHECK FOR EMPTY RESULTS POST-FETCH ---
        if (allComments.length === 0) {
            console.log("Fetching completed, but no comments were returned by the API.");
            // Check the displayed comment count vs fetched count
            if (foundPostData.comments_count > 0) {
                 setCommentFetchError(`Fetched 0 comments, although Instagram reports ${foundPostData.comments_count}. There might be an issue with the API or comment visibility.`);
            } else {
                 setCommentFetchError("No comments found for this post.");
            }
            setIsFetchingComments(false); // Stop loading
            return; // Stop processing
        }
        // --- END CHECK ---

        console.log("Applying rules...");
        // --- Apply Rules ---
        let eligibleComments = allComments;
        // ... (filtering logic for mentions and repeats as before) ...
        console.log(`Filtered eligible comments: ${eligibleComments.length}`);

        // --- Draw Winner ---
        if (eligibleComments.length === 0) {
            console.log("No eligible comments found after applying rules.");
            setCommentFetchError("No comments meet the specified criteria after filtering."); // More specific error
        } else if (eligibleComments.length < numWinners) {
            // ... (handle not enough eligible comments) ...
            setCommentFetchError(`Only ${eligibleComments.length} eligible comment(s) found, cannot draw ${numWinners} winner.`);
        } else {
            // ... (draw winner logic as before) ...
            const randomIndex = Math.floor(Math.random() * eligibleComments.length);
            const drawnWinner = eligibleComments[randomIndex];
            console.log("Winner Drawn:", drawnWinner);
            setWinner(drawnWinner);
        }

    } catch (error) {
        console.error("Unexpected error during pick winner process execution:", error);
        setCommentFetchError("An unexpected error occurred during the picking process.");
        setLoadingHint(null);
    } finally {
        setIsFetchingComments(false);
    }
  };

  return (
    <div className="container mx-auto py-3">
      {/* User Profile Component */}
      <UserProfile user={user} />

      <div>
        <SearchByUrlBar
              onPostFound={handlePostFound}
              onSearchStart={handleSearchStart}
              onSearchEnd={handleSearchEnd}
              disabled={isSearching} // Disable search while searching
          />

      {isSearching && <p style={{ marginTop: '10px' }}>Searching for post...</p>}
          {searchError && <p style={{ color: 'red', marginTop: '10px' }}>{searchError}</p>}
          {/* --- End Search Section --- */}


          {/* --- Found Post Details & Rules Form --- */}
          {/* This section ONLY appears when a post is successfully found */}
          {foundPostData && !isSearching && (
              <div style={{ marginTop: '30px', border: '1px solid #ddd', padding: '15px' }}>
                  <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'}}>
                      <h3>Found Post:</h3>
                      <button onClick={handleClearSelection} style={{fontSize: '0.8em'}}>Clear Selection</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '15px' }}>
                      <img
                          src={foundPostData.display_url || '/placeholder.png'}
                          alt="Found Post"
                          style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                      />
                      <div>
                          <p><strong>Caption:</strong> {foundPostData.caption?.substring(0, 100) || '(No caption)'}{foundPostData.caption && foundPostData.caption.length > 100 ? '...' : ''}</p>
                          <p><strong>Date:</strong> {new Date(foundPostData.timestamp).toLocaleDateString()}</p>
                          <p><strong>Likes:</strong> {foundPostData.like_count}</p>
                          <p><strong>Comments:</strong> {foundPostData.comments_count}</p>
                          {/* <p>ID: {foundPostData.id}</p> */}
                          {/* <p>Shortcode: {foundPostData.shortcode}</p> */}
                      </div>
                  </div>

                  <h4>Set Rules & Pick Winner:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                      {/* ... Rule Inputs (Number of Winners, Mentions, Repeats) ... */}
                      <label htmlFor="numWinners">Number of Winners:</label>
                      <input id="numWinners" type="number" min="1" value={numWinners} onChange={e => setNumWinners(Math.max(1, parseInt(e.target.value) || 1))} style={{ padding: '5px' }} />
                      <label htmlFor="numMentions">Min. Mentions (@):</label>
                      <input id="numMentions" type="number" min="0" value={numMentions} onChange={e => setNumMentions(Math.max(0, parseInt(e.target.value) || 0))} style={{ padding: '5px' }} />
                      <label htmlFor="allowRepeats">Allow Repeat Users?</label>
                      <input id="allowRepeats" type="checkbox" checked={allowRepeats} onChange={e => setAllowRepeats(e.target.checked)} />
                  </div>

                  <button
                    onClick={handlePickWinner}
                    disabled={isFetchingComments} // Disable button while fetching
                    style={{ marginTop: '20px', padding: '10px 20px', width: '100%', fontSize: '1.1em' }}
                  >
                      {isFetchingComments ? `Fetching Comments (${loadingHint?.count || 0})...` : 'Fetch Comments & Pick Winner'}
                  </button>

                  {/* --- Loading Animation Area --- */}
                  {isFetchingComments && loadingHint && (
                      <div style={{ marginTop: '15px', padding: '10px', border: '1px dashed #ccc', textAlign: 'center' }}>
                          <p>Loading page...</p>
                          {/* Simple animation hint: Show first user of latest page */}
                          {loadingHint.user && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', opacity: 0.7 }}>
                                  {loadingHint.user.profile_picture_url ? (
                                      <img src={loadingHint.user.profile_picture_url} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', marginRight: '8px' }} />
                                  ) : <div style={{ width: '24px', height: '24px', borderRadius: '50%', marginRight: '8px', background: '#eee' }}></div>}
                                  <span>{loadingHint.user.username}</span>
                              </div>
                          )}
                          <p>({loadingHint.count} comments loaded so far)</p>
                      </div>
                  )}
                  {/* --- End Loading Animation --- */}
                  {commentFetchError && !isFetchingComments && ( // Show fetch error here
                        <p style={{ color: 'red', marginTop: '10px' }}>Error fetching comments: {commentFetchError}</p>
                  )}
              </div>
          )}


      </div>

      {/* --- Hidden Comment Fetcher --- */}
      <CommentFetcher
           ref={commentFetcherRef}
           mediaId={foundPostData?.id ?? null}
           onError={setCommentFetchError} // Pass error setter callback
           onPageFetched={handleCommentPageFetched} // Pass progress callback
       />

       {/* --- Winner Display Area --- */}
       {winner && !isFetchingComments && (
           <div style={{marginTop: '30px', border: '3px solid gold', /*...*/}}>
               <h3>🎉 Winner! 🎉</h3>
                {/* ... Winner display logic ... */}
           </div>
       )}
      
    </div>
  )
}

export default PickerPage
