"use client"

import { useState } from "react"
import { Clock } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type TimePickerProps = {
  // 제어형: value를 주면 그 값을 반영. 안 주면 내부 state로 동작(비제어형). "HH:MM" (24시간)
  value?: string
  onChange?: (time: string) => void
  // 분 단위 간격 (기본 5분)
  minuteStep?: number
  className?: string
  placeholder?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))

export function TimePicker({
  value: controlled,
  onChange,
  minuteStep = 5,
  className,
  placeholder = "시간 선택",
}: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [internal, setInternal] = useState("")
  const value = controlled ?? internal
  const [hour, minute] = value ? value.split(":") : ["", ""]
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) =>
    String(i * minuteStep).padStart(2, "0"),
  )

  function change(next: string) {
    if (controlled === undefined) setInternal(next)
    onChange?.(next)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <Clock className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn(!value && "text-muted-foreground")}>{value || placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-2">
        <div className="flex gap-2">
          <div className="flex max-h-48 w-14 flex-col gap-1 overflow-y-auto pr-1">
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => change(`${h}:${minute || "00"}`)}
                className={cn(
                  "rounded-md px-2 py-1.5 text-center text-sm transition-colors hover:bg-accent",
                  hour === h && "bg-foreground text-background hover:bg-foreground",
                )}
              >
                {h}
              </button>
            ))}
          </div>
          <div className="flex max-h-48 w-14 flex-col gap-1 overflow-y-auto pr-1">
            {minutes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => change(`${hour || "00"}:${m}`)}
                className={cn(
                  "rounded-md px-2 py-1.5 text-center text-sm transition-colors hover:bg-accent",
                  minute === m && "bg-foreground text-background hover:bg-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
