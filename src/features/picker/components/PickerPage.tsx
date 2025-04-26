'use client'

import React, { useRef, useState } from "react";
import type { UserProfile as UserProfileType } from "@/lib/session";
import { UserProfile } from "./UserProfile";
import CommentFetcher, { type CommentFetcherRef } from './CommentFetcher';
import SearchByUrlBar from "./SearchByUrlBar";
import PostPreview from "./PostPreview";
import RulesForm from "./RulesForm";
import { WinnerDisplay, selectWinners } from "./WinnerSelector";
import type { Comment, FoundPost, CommentRules } from '../types/type';
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface PickerPageProps {
  user: UserProfileType
}

const PickerPage: React.FC<PickerPageProps> = ({ user }) => {
  // State for search functionality
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundPostData, setFoundPostData] = useState<FoundPost | null>(null);
  
  // State for rules
  const [rules, setRules] = useState<CommentRules>({
    numWinners: 1,
    numMentions: 0,
    allowRepeats: false
  });
  
  // State for comment fetching and winner selection
  const [isFetchingComments, setIsFetchingComments] = useState(false);
  const [isProcessingWinners, setIsProcessingWinners] = useState(false);
  const [commentFetchError, setCommentFetchError] = useState<string | null>(null);
  const [fetchedComments, setFetchedComments] = useState<Comment[]>([]);
  const [eligibleComments, setEligibleComments] = useState<Comment[]>([]);
  const [winners, setWinners] = useState<Comment[]>([]);
  const [eligibleCommentCount, setEligibleCommentCount] = useState<number | null>(null);
  const [commentCount, setCommentCount] = useState<number>(0);
  
  // Reference to comment fetcher component
  const commentFetcherRef = useRef<CommentFetcherRef>(null);

  // Handle search events
  const handleSearchStart = () => {
    setIsSearching(true);
    setSearchError(null);
    setFoundPostData(null);
    resetWinnerState();
  };

  const handleSearchEnd = (error?: string) => {
    setIsSearching(false);
    if (error) setSearchError(error);
  };

  const handlePostFound = (postData: FoundPost | null) => {
    setFoundPostData(postData);
  };

  const handleClearSelection = () => {
    setFoundPostData(null);
    resetWinnerState();
  };
  
  // Reset state related to winners
  const resetWinnerState = () => {
    setWinners([]);
    setFetchedComments([]);
    setEligibleComments([]);
    setCommentFetchError(null);
    setIsFetchingComments(false);
    setIsProcessingWinners(false); 
    setCommentCount(0);
    setEligibleCommentCount(null);
  };

  // Handle comment page fetch progress
  const handleCommentPageFetched = (totalCount: number) => {
    setCommentCount(totalCount);
  };

  // Handle replacing a winner with a new one
  const handleWinnerRedraw = (oldWinner: Comment, newWinner: Comment) => {
    setWinners(currentWinners => 
      currentWinners.map(winner => 
        winner.id === oldWinner.id ? newWinner : winner
      )
    );
  };

  // Process comments to select winners
  const processWinners = async (comments: Comment[]) => {
    console.log(`Processing ${comments.length} comments to select winners...`);
    setIsProcessingWinners(true);
    
    try {
      await selectWinners({
        comments,
        rules,
        onWinnersSelected: (selectedWinners) => {
          setWinners(selectedWinners);
          
          // Store eligible comments for potential redraws
          const currentWinnerIds = new Set(selectedWinners.map(w => w.id));
          const remainingEligible = comments.filter(c => !currentWinnerIds.has(c.id));
          setEligibleComments(remainingEligible);
        },
        onError: setCommentFetchError,
        onProcessingChange: setIsProcessingWinners,
        onEligibleCommentsCountChange: (count) => {
          setEligibleCommentCount(count);
        }
      });
    } catch (error) {
      console.error("Error processing winners:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      setCommentFetchError(message);
      setEligibleCommentCount(0);
    } finally {
      setIsProcessingWinners(false);
    }
  };

  // Handle the pick winner process
  const handlePickWinner = async () => {
    if (!foundPostData) return;
    
    setCommentFetchError(null);
    setWinners([]);

    // If we already have fetched comments, just reuse them
    if (fetchedComments.length > 0) {
      console.log(`Reusing ${fetchedComments.length} previously fetched comments`);
      await processWinners(fetchedComments);
      return;
    }
    
    // Otherwise fetch comments from API
    if (!commentFetcherRef.current) return;
    
    console.log(`Starting fetch process for Post ID: ${foundPostData.id}`);
    setIsFetchingComments(true);
    setCommentCount(0);
    
    try {
      // Fetch all comments
      const allComments = await commentFetcherRef.current.fetchAllComments();
      if (allComments === null) {
        throw new Error(commentFetchError || "Comment fetching failed.");
      }
      
      setFetchedComments(allComments);
      setIsFetchingComments(false);
      console.log(`Successfully fetched ${allComments.length} comments. Applying rules...`);
      
      // Process the fetched comments
      await processWinners(allComments);
      
    } catch (error) {
      console.error("Error during fetch and pick process:", error);
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      setCommentFetchError(message);
      setEligibleCommentCount(0);
    } finally {
      setIsFetchingComments(false);
      setCommentCount(0);
    }
  };

  const isLoading = isSearching || isFetchingComments || isProcessingWinners;
  
  // Determine button text based on current state
  const getButtonText = () => {
    if (isFetchingComments) {
      return `Fetching Comments${commentCount > 0 ? ` (${commentCount})` : ''}...`;
    }
    if (isProcessingWinners) {
      return 'Processing Winners...';
    }
    return fetchedComments.length > 0 ? 'Redraw Winners' : 'Fetch Comments & Pick Winner';
  };

  return (
    <div className="container mx-auto py-4 space-y-4">
      {/* User Profile */}
      <UserProfile user={user} />
      
      {/* Search Bar */}
      <div className="my-6 flex flex-col justify-center">
        <SearchByUrlBar
          onPostFound={handlePostFound}
          onSearchStart={handleSearchStart}
          onSearchEnd={handleSearchEnd}
          disabled={isLoading}
        />
        
        {isSearching && <Spinner className="self-center mt-4" />}
        {searchError && <p className="mt-4 text-center text-red-500">{searchError}</p>}
      </div>
      
      {/* Post Preview & Rules */}
      {foundPostData && !isSearching && (
        <>
          <PostPreview post={foundPostData} onClear={handleClearSelection} />
          
          <RulesForm 
            rules={rules} 
            onChange={setRules} 
            disabled={isLoading}
          />
          
          <Button
            onClick={handlePickWinner}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-full text-foreground text-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {getButtonText()}
          </Button>
          
          {/* Loading Indicators */}
          {(isFetchingComments || isProcessingWinners) && (
            <div className="flex flex-col items-center justify-center mt-6">
              <Spinner className="mb-2" />
              <p className="text-center text-muted-foreground">
                {isFetchingComments 
                  ? `Fetching comments${commentCount > 0 ? ` (${commentCount} so far)` : ''}...` 
                  : `Processing ${fetchedComments.length} comments to select ${rules.numWinners} winner(s)...`}
              </p>
            </div>
          )}
          
          {/* Error Display */}
          {commentFetchError && !isLoading && (
            <p className="mt-4 text-red-500">Error: {commentFetchError}</p>
          )}
          
          {/* Eligible Comment Count Display */}
          {eligibleCommentCount !== null && !isLoading && !commentFetchError && (
            <p className="mt-4 text-gray-600">
              {eligibleCommentCount} comments were eligible for winning based on your rules.
            </p>
          )}
        </>
      )}
      
      {/* Winner Display */}
      {winners.length > 0 && !isLoading && (
        <WinnerDisplay 
          winners={winners} 
          eligibleComments={eligibleComments}
          onWinnerRedraw={handleWinnerRedraw}
        />
      )}
      
      {/* Hidden Comment Fetcher Component */}
      <CommentFetcher
        ref={commentFetcherRef}
        mediaId={foundPostData?.id ?? null}
        onError={setCommentFetchError}
        onPageFetched={handleCommentPageFetched}
      />
    </div>
  );
};

export default PickerPage;