import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { getWorkout, toggleExercise } from '#/api/workout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Checkbox } from '#/components/ui/checkbox'
import { Progress, ProgressLabel, ProgressValue } from '#/components/ui/progress'
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
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Загрузка тренировки…
          </CardContent>
        </Card>
      </main>
    )
  }

  if (isError || !workout) {
    return (
      <main className="page-wrap px-4 pb-8 pt-14">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">День отдыха</CardTitle>
            <CardDescription>{today}</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            Сегодня тренировка не запланирована. Отдыхай и восстанавливайся!
          </CardContent>
        </Card>
      </main>
    )
  }

  const completedCount = workout.completedExerciseIds.length
  const totalCount = workout.exercises.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const allDone = completedCount === totalCount && totalCount > 0

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Сегодняшняя тренировка</CardTitle>
          <CardDescription>{today}</CardDescription>
        </CardHeader>

        <CardContent>
          <Progress value={progressPercent}>
            <ProgressLabel>Прогресс</ProgressLabel>
            <ProgressValue>{() => `${completedCount} / ${totalCount}`}</ProgressValue>
          </Progress>
        </CardContent>

        <CardContent className="space-y-2">
          {workout.exercises.map((exercise) => {
            const done = workout.completedExerciseIds.includes(exercise.id)
            return (
              <label
                key={exercise.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50 has-[:checked]:bg-muted/80"
              >
                <Checkbox
                  checked={done}
                  onCheckedChange={() => mutation.mutate(exercise.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-tight ${done ? 'text-muted-foreground line-through' : ''}`}>
                    {exercise.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {exercise.sets} × {exercise.reps}
                    {exercise.weight > 0 ? ` · ${exercise.weight} кг` : ''}
                  </p>
                </div>
              </label>
            )
          })}
        </CardContent>

        {allDone && (
          <CardContent className="pb-2">
            <div className="rounded-lg bg-primary/10 px-4 py-3 text-center text-sm font-semibold text-primary">
              Тренировка завершена!
            </div>
          </CardContent>
        )}
      </Card>
    </main>
  )
}
