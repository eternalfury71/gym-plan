import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { getWorkout, toggleExercise } from '#/api/workout'
import type { Workout } from '#/types/workout'

function getTodayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const Route = createFileRoute('/workout')({ component: WorkoutPage })

function WorkoutPage() {
  const today = getTodayISO()
  const queryClient = useQueryClient()

  const queryKey = ['workout', today] as const

  const { data: workout, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => getWorkout({ data: today }),
  })

  const mutation = useMutation({
    mutationFn: (exerciseId: string) =>
      toggleExercise({ data: { date: today, exerciseId } }),
    onMutate: async (exerciseId) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Workout | null>(queryKey)

      queryClient.setQueryData<Workout | null>(queryKey, (old) => {
        if (!old) return old
        const completed = old.completedExerciseIds.includes(exerciseId)
          ? old.completedExerciseIds.filter((id) => id !== exerciseId)
          : [...old.completedExerciseIds, exerciseId]
        return { ...old, completedExerciseIds: completed }
      })

      return { previous }
    },
    onError: (_err, _exerciseId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  if (isLoading) {
    return (
      <main className="page-wrap px-4 pb-8 pt-14">
        <div className="island-shell rise-in rounded-2xl p-8 text-center">
          <p className="text-[var(--sea-ink-soft)]">Загрузка тренировки…</p>
        </div>
      </main>
    )
  }

  if (isError || !workout) {
    return (
      <main className="page-wrap px-4 pb-8 pt-14">
        <section className="island-shell rise-in rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14 text-center">
          <p className="island-kicker mb-3">День отдыха</p>
          <h1 className="display-title mb-4 text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
            {today}
          </h1>
          <p className="text-[var(--sea-ink-soft)]">
            Сегодня тренировка не запланирована. Отдыхай и восстанавливайся!
          </p>
        </section>
      </main>
    )
  }

  const completedCount = workout.completedExerciseIds.length
  const totalCount = workout.exercises.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
        <p className="island-kicker mb-2">Сегодняшняя тренировка</p>
        <h1 className="display-title mb-6 text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          {today}
        </h1>

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-[var(--sea-ink)]">
              Прогресс
            </span>
            <span className="text-sm font-semibold text-[var(--lagoon-deep)]">
              {completedCount} / {totalCount}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--line)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--lagoon),var(--palm))] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Exercises */}
        <ul className="m-0 list-none space-y-3 p-0">
          {workout.exercises.map((exercise) => {
            const done = workout.completedExerciseIds.includes(exercise.id)
            return (
              <li key={exercise.id}>
                <button
                  type="button"
                  onClick={() => mutation.mutate(exercise.id)}
                  className={`flex w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                    done
                      ? 'border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.1)]'
                      : 'border-[var(--line)] bg-[var(--surface)]'
                  }`}
                >
                  {/* Checkbox */}
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${
                      done
                        ? 'border-[var(--lagoon)] bg-[var(--lagoon)] text-white'
                        : 'border-[var(--line)] bg-transparent'
                    }`}
                  >
                    {done && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>

                  {/* Exercise info */}
                  <div className="flex-1">
                    <p
                      className={`m-0 text-base font-semibold ${
                        done
                          ? 'text-[var(--sea-ink-soft)] line-through'
                          : 'text-[var(--sea-ink)]'
                      }`}
                    >
                      {exercise.name}
                    </p>
                    <p className="m-0 mt-0.5 text-sm text-[var(--sea-ink-soft)]">
                      {exercise.sets} × {exercise.reps}
                      {exercise.weight > 0 ? ` · ${exercise.weight} кг` : ''}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>

        {completedCount === totalCount && totalCount > 0 && (
          <div className="mt-8 rounded-2xl border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.1)] p-6 text-center">
            <p className="m-0 text-lg font-bold text-[var(--lagoon-deep)]">
              Тренировка завершена!
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
