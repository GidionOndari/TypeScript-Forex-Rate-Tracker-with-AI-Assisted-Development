const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'KES'] as const

export function createCurrencySelector(onChange: (currency: string) => void): HTMLSelectElement {
  const select = document.createElement('select')
  select.name = 'base-currency'
  select.id = 'base-currency'

  SUPPORTED_CURRENCIES.forEach((currencyCode) => {
    const option = document.createElement('option')
    option.value = currencyCode
    option.textContent = currencyCode
    select.appendChild(option)
  })

  select.addEventListener('change', (event) => {
    const target = event.currentTarget

    if (!(target instanceof HTMLSelectElement)) {
      return
    }

    onChange(target.value)
  })

  return select
}
