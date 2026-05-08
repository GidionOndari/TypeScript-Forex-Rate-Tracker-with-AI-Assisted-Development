export type VerificationRefreshIntent = () => void

export interface VerificationScheduler {
  start: () => void
  stop: () => void
}

export function createVerificationScheduler(requestRefresh: VerificationRefreshIntent, intervalMs: number): VerificationScheduler {
  let timerId: number | null = null

  return {
    start: () => {
      if (timerId !== null) {
        return
      }
      timerId = window.setInterval(() => {
        requestRefresh()
      }, intervalMs)
    },
    stop: () => {
      if (timerId === null) {
        return
      }
      window.clearInterval(timerId)
      timerId = null
    },
  }
}
