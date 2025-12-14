import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Seeded random number generator for deterministic shuffling
 * Uses a simple LCG (Linear Congruential Generator) algorithm
 */
function seededRandom(seed: number) {
  let state = seed
  return function() {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

/**
 * Fisher-Yates shuffle algorithm with seeded randomization
 * @param array - Array to shuffle
 * @param seed - Seed for deterministic randomization (e.g., userId + questionId)
 * @returns Shuffled array
 */
export function shuffleWithSeed<T>(array: T[], seed: string): T[] {
  const clonedArray = [...array]
  const numericSeed = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const random = seededRandom(numericSeed)
  
  for (let i = clonedArray.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [clonedArray[i], clonedArray[j]] = [clonedArray[j], clonedArray[i]]
  }
  
  return clonedArray
}

/**
 * Shuffle question options deterministically based on user and question
 * @param options - Question options array
 * @param userId - User ID for personalized shuffling
 * @param questionId - Question ID for consistency
 * @param shouldShuffle - Whether to shuffle (from question.randomize_options)
 * @param attemptId - Optional Attempt ID to ensure unique shuffle per attempt
 * @returns Shuffled or original options
 */
export function shuffleQuestionOptions<T extends { id: string; option_label?: string }>(
  options: T[],
  userId: string,
  questionId: string,
  shouldShuffle: boolean,
  attemptId?: string
): T[] {
  if (!shouldShuffle || options.length <= 1) {
    return options
  }
  
  // Include attemptId in seed if provided, otherwise fallback to user+question (legacy behavior)
  const seed = attemptId ? `${userId}-${questionId}-${attemptId}` : `${userId}-${questionId}`
  return shuffleWithSeed(options, seed)
}
