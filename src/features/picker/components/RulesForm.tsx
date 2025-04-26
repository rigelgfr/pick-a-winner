"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { CommentRules } from "../types/type"

interface RulesFormProps {
  rules: CommentRules
  onChange: (rules: CommentRules) => void
  disabled?: boolean
}

const RulesForm: React.FC<RulesFormProps> = ({ rules, onChange, disabled = false }) => {
    const handleChange = <T extends number | boolean>(field: keyof CommentRules, value: T) => {
        onChange({
      ...rules,
      [field]: value,
    })
  }

  return (
    <div className="py-2">
      <div className="pb-2">
        <h4 className="text-lg font-sm">Set Rules📃</h4>
      </div>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 items-center gap-4">
          <Label htmlFor="numWinners" className="text-sm">
            Number of Winners
          </Label>
          <Input
            id="numWinners"
            type="number"
            min="1"
            value={rules.numWinners}
            onChange={(e) => handleChange("numWinners", Math.max(1, Number.parseInt(e.target.value) || 1))}
            disabled={disabled}
            className="rounded-full"
          />
        </div>

        <div className="grid grid-cols-2 items-center gap-4">
          <Label htmlFor="numMentions" className="text-sm">
            Min. Mentions (@)
          </Label>
          <Input
            id="numMentions"
            type="number"
            min="0"
            value={rules.numMentions}
            onChange={(e) => handleChange("numMentions", Math.max(0, Number.parseInt(e.target.value) || 0))}
            disabled={disabled}
            className="rounded-full"
          />
        </div>

        <div className="grid grid-cols-2 items-center gap-4">
          <Label htmlFor="allowRepeats" className="text-sm">
            Allow Repeat Users
          </Label>
          <Switch
            id="allowRepeats"
            checked={rules.allowRepeats}
            onCheckedChange={(checked) => handleChange("allowRepeats", checked)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}

export default RulesForm