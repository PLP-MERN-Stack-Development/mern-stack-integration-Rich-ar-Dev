// Simple relative time formatter using Intl.RelativeTimeFormat when available
export function formatRelative(dateInput) {
  if (!dateInput) return ''
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (Number.isNaN(date.getTime())) return ''

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  const rtf = typeof Intl !== 'undefined' && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }) : null

  const divisions = [
    { amount: 60, name: 'seconds' },
    { amount: 60, name: 'minutes' },
    { amount: 24, name: 'hours' },
    { amount: 7, name: 'days' },
    { amount: 4.34524, name: 'weeks' },
    { amount: 12, name: 'months' },
    { amount: Infinity, name: 'years' },
  ]

  let unit = 'seconds'
  let value = seconds
  let i = 0
  while (i < divisions.length) {
    const division = divisions[i]
    if (Math.abs(value) < division.amount) {
      unit = division.name
      break
    }
    value = Math.round(value / division.amount)
    i += 1
  }

  const mapUnit = {
    seconds: 'second',
    minutes: 'minute',
    hours: 'hour',
    days: 'day',
    weeks: 'week',
    months: 'month',
    years: 'year',
  }

  const normalizedUnit = mapUnit[unit] || 'second'

  if (rtf) {
    return rtf.format(-value, normalizedUnit)
  }

  // Fallback simple string
  if (Math.abs(value) <= 1) {
    return `1 ${normalizedUnit} ago`
  }
  return `${Math.abs(value)} ${normalizedUnit}s ago`
}

export default formatRelative
