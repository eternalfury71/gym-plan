import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ru } from 'date-fns/locale'
import { DayPicker, type DayButtonProps } from 'react-day-picker'
import { getWorkoutHistory } from '#/api/workout'
import type { DayStatus } from '#/api/workout'
import { useState } from 'react'

import 'react-day-picker/style.css'

export const Route = createFileRoute('/history')({ component: HistoryPage })

function formatDateISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function HistoryPage() {
  const [month, setMonth] = useState(new Date())
  const year = month.getFullYear()
  const monthNum = month.getMonth() + 1
  const todayStr = formatDateISO(new Date())

  const { data: days } = useQuery({
    queryKey: ['workout-history', year, monthNum],
    queryFn: () => getWorkoutHistory({ data: { year, month: monthNum } }),
  })

  const statusMap = useMemo(() => {
    const map = new Map<string, DayStatus>()
    if (days) {
      for (const d of days) map.set(d.date, d)
    }
    return map
  }, [days])

  const completedDates: Date[] = []
  const partialDates: Date[] = []
  const restDates: Date[] = []

  if (days) {
    for (const d of days) {
      const date = new Date(d.date)
      if (d.totalExercises === 0) {
        restDates.push(date)
      } else if (d.completedExercises === d.totalExercises) {
        completedDates.push(date)
      } else if (d.completedExercises > 0) {
        partialDates.push(date)
      }
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
        <p className="island-kicker mb-4">История тренировок</p>

        <div className="gym-calendar flex justify-center">
          <DayPicker
            mode="single"
            locale={ru}
            month={month}
            onMonthChange={setMonth}
            weekStartsOn={1}
            modifiers={{
              completed: completedDates,
              partial: partialDates,
              rest: restDates,
              future: { after: new Date() },
            }}
            modifiersClassNames={{
              completed: 'day-completed',
              partial: 'day-partial',
              rest: 'day-rest',
              future: 'day-future',
              today: 'day-today',
            }}
            components={{
              DayButton: (props) => (
                <WorkoutDayButton {...props} statusMap={statusMap} todayStr={todayStr} />
              ),
            }}
          />
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--sea-ink-soft)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-[var(--lagoon)]" />
            Завершена
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-[rgba(79,184,178,0.3)]" />
            Частично
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border border-[var(--line)]" />
            Не начата
          </span>
        </div>
      </section>
    </main>
  )
}

function WorkoutDayButton({
  day,
  modifiers,
  statusMap,
  todayStr,
  ...buttonProps
}: DayButtonProps & { statusMap: Map<string, DayStatus>; todayStr: string }) {
  const dateStr = formatDateISO(day.date)
  const status = statusMap.get(dateStr)
  const isFuture = dateStr > todayStr
  const hasProgress = status && status.totalExercises > 0 && !isFuture

  return (
    <button type="button" {...buttonProps}>
      <span>{day.date.getDate()}</span>
      {hasProgress && (
        <span className="day-progress">
          {status.completedExercises}/{status.totalExercises}
        </span>
      )}
    </button>
  )
}
