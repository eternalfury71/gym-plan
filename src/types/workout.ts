export type Exercise = {
  id: string
  name: string
  sets: number
  reps: number
  weight: number
}

export type Workout = {
  id: string
  date: string
  exercises: Exercise[]
  completedExerciseIds: string[]
}
