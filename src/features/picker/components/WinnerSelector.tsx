import { useState } from "react"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, ExternalLink, Calendar, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { Comment, CommentRules } from "../types/type"
import { fetchMultipleCommentUsernames } from "../lib/comment"

interface WinnerSelectorProps {
  comments: Comment[]
  rules: CommentRules
  onWinnersSelected: (winners: Comment[]) => void
  onError: (error: string) => void
  onProcessingChange: (isProcessing: boolean) => void
  onEligibleCommentsCountChange: (count: number) => void
}

// Function to get random winners from eligible comments
const getRandomWinners = (eligibleComments: Comment[], count: number) => {
  // Create a copy to avoid modifying the original array
  const shuffled = [...eligibleComments];
  
  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Return the first n elements
  return shuffled.slice(0, count);
}

export const selectWinners = async ({
  comments,
  rules,
  onWinnersSelected,
  onError,
  onProcessingChange,
  onEligibleCommentsCountChange,
}: WinnerSelectorProps) => {
  try {
    onProcessingChange(true)
    console.log(`Applying rules to ${comments.length} comments...`)

    // Apply Rules
    let eligibleComments = [...comments]

    // Filter out comments with no text first to prevent errors
    eligibleComments = eligibleComments.filter((comment) => comment && comment.text)

    // Rule: Minimum Mentions
    if (rules.numMentions > 0) {
      eligibleComments = eligibleComments.filter((comment) => {
        // Safely access text property and match mentions
        const text = comment.text || ""
        const mentionCount = (text.match(/@\S+/g) || []).length
        return mentionCount >= rules.numMentions
      })
      console.log(`After mention filter (${rules.numMentions}): ${eligibleComments.length} comments`)
    }

    // Rule: No Repeat Users
    if (!rules.allowRepeats) {
      // First, fetch usernames for all comments that don't have them yet
      const commentsWithUsernames = await fetchMultipleCommentUsernames(eligibleComments)

      // Then filter for uniqueness
      const uniqueUsernames = new Set<string>()
      eligibleComments = commentsWithUsernames.filter((comment) => {
        if (!comment.username) return false // Skip if username couldn't be fetched

        if (!uniqueUsernames.has(comment.username)) {
          uniqueUsernames.add(comment.username)
          return true
        }
        return false
      })

      console.log(`After unique user filter: ${eligibleComments.length} comments`)
    }

    onEligibleCommentsCountChange(eligibleComments.length)

    // Check if we have any eligible comments
    if (eligibleComments.length === 0) {
      throw new Error("No comments meet the specified criteria after filtering.")
    }

    // Draw Winners (respecting the numWinners rule)
    const numberOfWinners = Math.min(rules.numWinners, eligibleComments.length)
    
    // Get random winners
    const selectedWinners = getRandomWinners(eligibleComments, numberOfWinners)

    // Make sure all winners have usernames
    const winnersWithUsernames = await fetchMultipleCommentUsernames(selectedWinners)

    // Call the callback with the complete winners information
    onWinnersSelected(winnersWithUsernames)
  } catch (error) {
    console.error("Error selecting winners:", error)
    onError(error instanceof Error ? error.message : "An unexpected error occurred.")
  } finally {
    onProcessingChange(false)
  }
}

// React component to display the winners
export const WinnerDisplay: React.FC<{ 
  winners: Comment[], 
  eligibleComments: Comment[], 
  onWinnerRedraw: (oldWinner: Comment, newWinner: Comment) => void 
}> = ({ winners, eligibleComments, onWinnerRedraw }) => {
  const [validStatus, setValidStatus] = useState<Record<string, boolean>>({})
  const [redrawLoading, setRedrawLoading] = useState<Record<string, boolean>>({})
  
  if (!winners || winners.length === 0) return null

  const handleValidityChange = (winnerId: string, isValid: boolean) => {
    setValidStatus(prev => ({
      ...prev,
      [winnerId]: isValid
    }))
  }

  const handleRedraw = async (winner: Comment) => {
    // Set loading state for this specific winner
    setRedrawLoading(prev => ({
      ...prev,
      [winner.id]: true
    }))
    
    try {
      // Filter out current winners to avoid picking them again
      const currentWinnerIds = new Set(winners.map(w => w.id))
      const remainingComments = eligibleComments.filter(comment => !currentWinnerIds.has(comment.id))
      
      if (remainingComments.length === 0) {
        throw new Error("No more eligible comments available for redraw")
      }
      
      // Get a random new winner from remaining eligible comments
      const newWinner = getRandomWinners(remainingComments, 1)[0]
      
      // Make sure the new winner has a username
      const [newWinnerWithUsername] = await fetchMultipleCommentUsernames([newWinner])
      
      // Call the parent callback to update the winners array
      onWinnerRedraw(winner, newWinnerWithUsername)
      
      // Mark the new winner as valid by default
      setValidStatus(prev => ({
        ...prev,
        [newWinnerWithUsername.id]: true
      }))
    } catch (error) {
      console.error("Error during redraw:", error)
      // Reset the validity status to avoid showing redraw button
      setValidStatus(prev => ({
        ...prev,
        [winner.id]: true
      }))
      
      // You could show an error message here
      alert(error instanceof Error ? error.message : "Failed to redraw winner")
    } finally {
      // Reset loading state
      setRedrawLoading(prev => ({
        ...prev,
        [winner.id]: false
      }))
    }
  }

  return (
    <div className="space-y-4 my-8">
      <h3 className="text-2xl font-bold flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        {winners.length > 1 ? "Winners" : "Winner"}
      </h3>

      <div className="grid gap-4 lg:grid-cols-2">
        {winners.map((winner, index) => (
          <Card key={winner.id} className={`bg-muted/50 ${validStatus[winner.id] === false ? 'border-red-300' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                  {index + 1}
                </Badge>
                <a
                  href={`https://instagram.com/${winner.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium flex items-center gap-1"
                >
                  @{winner.username || "[Username unavailable]"}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`valid-${winner.id}`}
                    checked={validStatus[winner.id] !== false}
                    onCheckedChange={(checked) => handleValidityChange(winner.id, checked)}
                  />
                  <Label htmlFor={`valid-${winner.id}`} className="text-xs">
                    {validStatus[winner.id] === false ? "Not Valid" : "Valid"}
                  </Label>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <blockquote className="italic bg-accent p-3 rounded-md text-sm">
                "{winner.text || "[No comment text available]"}"
              </blockquote>
            </CardContent>

            <CardFooter className="flex justify-between items-center">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(winner.timestamp).toLocaleString()}</span>
              </div>
              
              {validStatus[winner.id] === false && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => handleRedraw(winner)}
                  disabled={redrawLoading[winner.id]}
                >
                  {redrawLoading[winner.id] ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Redraw
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}