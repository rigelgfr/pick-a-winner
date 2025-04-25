import type React from "react"
import type { UserProfile as UserProfileType } from "@/lib/session"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface UserProfileProps {
  user: UserProfileType
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <>
        {/* Profile Header */}
        <div className="flex flex-row items-start gap-4 md:gap-6">
          {/* Profile Picture */}
          <Avatar className="w-20 h-20 md:w-32 md:h-32 border-2 border-white shadow-md bg-red-50">
            {user.profile_picture_url ? (
              <AvatarImage src={user.profile_picture_url} alt={`${user.username}'s profile`} />
            ) : (
              <AvatarFallback className="text-2xl md:text-4xl bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                {user.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            )}
          </Avatar>

          {/* Profile Info */}
          <div className="flex-1 space-y-2">
            {/* Username and Name */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold">{user.username}</h2>
              </div>
              {user.name && (
                <p className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">{user.name}</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 sm:flex sm:grid-cols-none">
              <div className="flex flex-col items-start">
                <span className="font-bold">{user.media_count?.toLocaleString('en-US') || "0"}</span>
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">posts</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold">{user.followers_count?.toLocaleString('en-US') || "0"}</span>
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">followers</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold">{user.follows_count?.toLocaleString('en-US') || "0"}</span>
                <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">following</span>
              </div>
            </div>

            {/* Bio */}
            {user.biography && (
              <p className="text-xs md:text-sm max-sm:hidden text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {user.biography}
              </p>
            )}

          </div>
        </div>
        <Separator className="mt-4" />
    </>  
  )
}
