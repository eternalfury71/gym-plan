import { createServerFn } from '@tanstack/react-start'
import type { Exercise, Workout } from '#/types/workout'

// Программы по дням недели (0=Вс, 1=Пн, ..., 6=Сб)
// Пн — грудь + трицепс, Вт — спина + бицепс, Ср — ноги,
// Чт — плечи + пресс, Пт — всё тело, Сб/Вс — отдых
const PROGRAMS: Record<number, { label: string; exercises: Omit<Exercise, 'id'>[] }> = {
  1: {
    label: 'Грудь + Трицепс',
    exercises: [
      { name: 'Жим лёжа', sets: 4, reps: 8, weight: 60 },
      { name: 'Жим гантелей на наклонной', sets: 3, reps: 10, weight: 22 },
      { name: 'Разводка гантелей', sets: 3, reps: 12, weight: 14 },
      { name: 'Отжимания на брусьях', sets: 3, reps: 10, weight: 0 },
      { name: 'Французский жим', sets: 3, reps: 12, weight: 20 },
    ],
  },
  2: {
    label: 'Спина + Бицепс',
    exercises: [
      { name: 'Подтягивания', sets: 4, reps: 8, weight: 0 },
      { name: 'Тяга штанги в наклоне', sets: 4, reps: 8, weight: 50 },
      { name: 'Тяга верхнего блока', sets: 3, reps: 10, weight: 45 },
      { name: 'Тяга гантели одной рукой', sets: 3, reps: 10, weight: 24 },
      { name: 'Сгибания на бицепс', sets: 3, reps: 12, weight: 14 },
    ],
  },
  3: {
    label: 'Ноги',
    exercises: [
      { name: 'Приседания со штангой', sets: 4, reps: 8, weight: 80 },
      { name: 'Жим ногами', sets: 4, reps: 10, weight: 120 },
      { name: 'Выпады с гантелями', sets: 3, reps: 12, weight: 16 },
      { name: 'Разгибания ног', sets: 3, reps: 12, weight: 40 },
      { name: 'Румынская тяга', sets: 3, reps: 10, weight: 50 },
    ],
  },
  4: {
    label: 'Плечи + Пресс',
    exercises: [
      { name: 'Жим гантелей стоя', sets: 4, reps: 10, weight: 16 },
      { name: 'Махи гантелей в стороны', sets: 3, reps: 15, weight: 8 },
      { name: 'Тяга к подбородку', sets: 3, reps: 12, weight: 25 },
      { name: 'Скручивания', sets: 3, reps: 20, weight: 0 },
      { name: 'Планка', sets: 3, reps: 60, weight: 0 },
    ],
  },
  5: {
    label: 'Всё тело',
    exercises: [
      { name: 'Становая тяга', sets: 4, reps: 6, weight: 80 },
      { name: 'Жим лёжа', sets: 3, reps: 8, weight: 55 },
      { name: 'Подтягивания', sets: 3, reps: 8, weight: 0 },
      { name: 'Приседания со штангой', sets: 3, reps: 8, weight: 70 },
      { name: 'Жим гантелей стоя', sets: 3, reps: 10, weight: 14 },
    ],
  },
}

function generateWorkout(date: string): Workout | null {
  const dayOfWeek = new Date(date).getDay()
  const program = PROGRAMS[dayOfWeek]
  if (!program) return null // Сб/Вс — день отдыха

  return {
    id: `w-${date}`,
    date,
    exercises: program.exercises.map((ex, i) => ({
      ...ex,
      id: `${date}-e${i}`,
    })),
    completedExerciseIds: [],
  }
}

// In-memory кэш сгенерированных тренировок (сохраняет completedExerciseIds между запросами)
const workoutCache = new Map<string, Workout>()

function getOrCreateWorkout(date: string): Workout | null {
  const cached = workoutCache.get(date)
  if (cached) return cached

  const workout = generateWorkout(date)
  if (workout) workoutCache.set(date, workout)
  return workout
}

export const getWorkout = createServerFn({ method: 'GET' })
  .inputValidator((date: string) => date)
  .handler(async ({ data: date }) => {
    await new Promise((r) => setTimeout(r, 300))
    
    return getOrCreateWorkout(date)
  })

export const toggleExercise = createServerFn({ method: 'POST' })
  .inputValidator((data: { date: string; exerciseId: string }) => data)
  .handler(async ({ data: { date, exerciseId } }) => {
    await new Promise((r) => setTimeout(r, 200))

    const workout = getOrCreateWorkout(date)
    if (!workout) throw new Error('Workout not found')

    const idx = workout.completedExerciseIds.indexOf(exerciseId)
    if (idx === -1) {
      workout.completedExerciseIds.push(exerciseId)
    } else {
      workout.completedExerciseIds.splice(idx, 1)
    }

    return workout
  })
