import type { VerifiedViewModel } from '../../utils/truth/types'

export function renderVerificationBoundary<T>(
  container: HTMLElement,
  state: VerifiedViewModel<T>,
  renderVerified: (data: T) => void,
  onRetry?: () => void,
): void {
  container.innerHTML = ''

  if (state.state === 'verified') {
    renderVerified(state.data)
    return
  }

  const wrapper = document.createElement('div')
  wrapper.className = 'status-panel fade-in'

  const message = document.createElement('p')
  message.className = 'status-message'
  message.textContent = state.reason
  wrapper.appendChild(message)

  if (state.state === 'unavailable' && onRetry) {
    const retryButton = document.createElement('button')
    retryButton.type = 'button'
    retryButton.textContent = 'Retry'
    retryButton.className = 'btn'
    retryButton.addEventListener('click', onRetry)
    wrapper.appendChild(retryButton)
  }

  container.appendChild(wrapper)
}
