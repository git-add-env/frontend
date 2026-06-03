"use client"

import * as React from "react"
import { ko } from "date-fns/locale"

import { Calendar } from "@/components/ui/calendar"

type CalendarsProps = {
    // 선택한 날짜와 변경 핸들러를 부모에서 받음 (제어 컴포넌트)
    selected?: Date
    onSelect?: (date: Date | undefined) => void
}

export function Calendars({ selected, onSelect }: CalendarsProps) {
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const currentYear = today.getFullYear()

    return (
        <Calendar
            mode="single"
            selected={selected}
            onSelect={onSelect}
            locale={ko}
            captionLayout="dropdown"
            disabled={{ before: today }}
            startMonth={today}
            endMonth={new Date(currentYear + 5, 11)}
            className="rounded-lg border"
        />
    )
}
