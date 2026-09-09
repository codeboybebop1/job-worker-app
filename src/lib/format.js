/**
 * Formatting helpers — mirrors the old app's fmtNum and fmtDate exactly
 * so numbers and dates look identical in the new UI.
 */

/** Format a number with Indian locale, up to `dp` decimal places. */
export function fmtNum(n, dp = 2) {
  if (n === null || n === undefined || isNaN(n)) return '-'
  return Number(n).toLocaleString('en-IN', {
    maximumFractionDigits: dp,
    minimumFractionDigits: 0,
  })
}

/** Format a date string into DD-Mon-YYYY (Indian locale). */
export function fmtDate(d) {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Get today's date as YYYY-MM-DD string. */
export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

/** Generate a short unique ID for new records before they hit the DB. */
export function nextId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
