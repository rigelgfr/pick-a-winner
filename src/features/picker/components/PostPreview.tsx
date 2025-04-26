"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Heart, MessageSquare, X } from "lucide-react"
import type { FoundPost } from "../types/type"

interface PostPreviewProps {
  post: FoundPost
  onClear: () => void
}

const PostPreview: React.FC<PostPreviewProps> = ({ post, onClear }) => {
  return (
    <div className="p-4 bg-muted/50 rounded-xl shadow-md relative">
      {/* Close button positioned absolute to the top right corner */}
      <Button 
        onClick={onClear} 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 absolute top-1 right-1 rounded-full"
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex flex-col sm:flex-row gap-4 mt-5 md:mt-4">
        <div className="w-full sm:w-1/4 rounded-xl overflow-hidden bg-muted">
          <img
            src={post.display_url || "/placeholder.png"}
            alt="Post thumbnail"
            className="object-cover w-full h-full"
          />
        </div>

        <div className="flex-1 flex flex-col">
          {/* Caption centered vertically in its container */}
          <div className="flex-1 flex items-center">
            <p className="text-sm w-full">
              {post.caption || "No caption available"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats always at the bottom, outside the flex row layout */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{new Date(post.timestamp).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-1">
          <Heart className="h-4 w-4" />
          <span>{post.like_count.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-1">
          <MessageSquare className="h-4 w-4" />
          <span>{post.comments_count.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

export default PostPreview