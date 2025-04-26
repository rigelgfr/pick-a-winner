"use client"
import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export interface FoundPost {
  id: string
  display_url?: string
  caption?: string
  timestamp: string
  like_count: number
  comments_count: number
  shortcode: string
}

interface SearchByUrlProps {
  onPostFound: (postData: FoundPost | null) => void
  onSearchStart: () => void
  onSearchEnd: (error?: string) => void
  disabled?: boolean
}

const SearchByUrlBar: React.FC<SearchByUrlProps> = ({ onPostFound, onSearchStart, onSearchEnd, disabled = false }) => {
  const [url, setUrl] = useState("")

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    onSearchStart()
    onPostFound(null)

    try {
      const response = await fetch(`/api/media/search?url=${encodeURIComponent(url)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Search failed: ${response.statusText}`)
      }

      if (data.post) {
        onPostFound(data.post)
        onSearchEnd()
      } else {
        onSearchEnd("Post data not found in response.")
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Search failed."
      console.error("Error searching by URL:", err)
      onSearchEnd(errorMsg)
    }
  }

  return (
    <div className="flex justify-center">
        <form onSubmit={handleSearch} className="flex gap-2 w-[600px]">
            <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter Instagram Post URL"
                required
                disabled={disabled}
                className="flex-1 rounded-full"

            />
            <Button type="submit" disabled={disabled} className="hidden sm:flex rounded-full text-foreground">
                <Search className="h-4 w-4" />
                Search
            </Button>
            <Button type="submit" disabled={disabled} className="sm:hidden rounded-full text-foreground">
                <Search className="h-4 w-4" />
            </Button>
        </form>
    </div>
  )
}

export default SearchByUrlBar
