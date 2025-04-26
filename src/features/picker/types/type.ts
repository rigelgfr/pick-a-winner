// types/comment.ts
export interface Comment {
    id: string;
    text?: string;
    timestamp: string;
    username?: string;
    profile_picture_url?: string;
}

export interface FoundPost {
    id: string;
    display_url?: string;
    caption?: string;
    timestamp: string;
    like_count: number;
    comments_count: number;
    shortcode?: string;
}

export interface CommentRules {
    numWinners: number;
    numMentions: number;
    allowRepeats: boolean;
}