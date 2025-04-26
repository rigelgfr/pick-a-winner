// services/commentService.ts
import type { Comment } from "../types/type";

export async function fetchCommentUsername(commentId: string): Promise<string | null> {
    try {
        console.log(`Fetching username for comment ID: ${commentId}`);
        const response = await fetch(`/api/comments/details?commentId=${commentId}`);
        const data = await response.json();
        
        if (response.ok && data.from?.username) {
            return data.from.username;
        } else {
            console.warn(`Could not fetch username for comment ${commentId}: ${data.error || 'Unknown error'}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching username for comment ${commentId}:`, error);
        return null;
    }
}

export async function fetchMultipleCommentUsernames(comments: Comment[]): Promise<Comment[]> {
    const enhancedComments = [...comments];
    
    // Process in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < enhancedComments.length; i += batchSize) {
        const batch = enhancedComments.slice(i, i + batchSize);
        const promises = batch.map(async (comment, index) => {
            if (!comment.username) {
                const username = await fetchCommentUsername(comment.id);
                if (username) {
                    enhancedComments[i + index].username = username;
                }
            }
        });
        
        await Promise.all(promises);
    }
    
    return enhancedComments;
}