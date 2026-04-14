import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { getWorkout, toggleExercise } from '#/api/workout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Checkbox } from '#/components/ui/checkbox'
import { Progress, ProgressLabel, ProgressValue } from '#/components/ui/progress'
import type { Workout } from '#/types/workout'

const today = () => new Date().toLocaleDateString('en-CA')

export const Route = createFileRoute('/workout')({ component: WorkoutPage })

function WorkoutPage() {
  const date = today()
  const qc = useQueryClient()
  const key = ['workout', date]

  const { data: workout, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: () => getWorkout({ data: date }),
  })

  const toggle = useMutation({
    mutationFn: (exerciseId: string) => toggleExercise({ data: { date, exerciseId } }),
    onMutate: async (exerciseId) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Workout | null>(key)

      qc.setQueryData<Workout | null>(key, (old) => {
        if (!old) return old
        const ids = old.completedExerciseIds
        return {
          ...old,
          completedExerciseIds: ids.includes(exerciseId)
            ? ids.filter((id) => id !== exerciseId)
            : [...ids, exerciseId],
        }
      })

      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(key, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
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
            <CardDescription>{date}</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            Отдых
          </CardContent>
        </Card>
      </main>
    )
  }

  const done = workout.completedExerciseIds
  const total = workout.exercises.length
  const percent = total ? Math.round((done.length / total) * 100) : 0
  const allDone = total > 0 && done.length === total

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Сегодняшняя тренировка</CardTitle>
          <CardDescription>{date}</CardDescription>
        </CardHeader>

        <CardContent>
          <Progress value={percent}>
            <ProgressLabel>Прогресс</ProgressLabel>
            <ProgressValue>{() => `${done.length} / ${total}`}</ProgressValue>
          </Progress>
        </CardContent>

        <CardContent className="space-y-2">
          {workout.exercises.map((ex) => {
            const checked = done.includes(ex.id)
            return (
              <label
                key={ex.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <Checkbox checked={checked} onCheckedChange={() => toggle.mutate(ex.id)} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-tight ${checked ? 'text-muted-foreground line-through' : ''}`}>
                    {ex.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ex.sets} × {ex.reps}{ex.weight > 0 && ` · ${ex.weight} кг`}
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
