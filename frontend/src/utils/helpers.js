/**
 * Helper Utilities
 */

/**
 * Format a number as currency (USD by default).
 */
export const formatCurrency = (value, currency = 'USD') => {
    if (value == null || isNaN(value)) return '$0'
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value)
}

/**
 * Format a date string to a readable format.
 */
export const formatDate = (dateStr, includeTime = false) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    if (isNaN(date)) return '—'
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    if (includeTime) {
        options.hour = '2-digit'
        options.minute = '2-digit'
    }
    return date.toLocaleDateString('en-US', options)
}

/**
 * Get a CSS class name for a pipeline stage badge.
 */
export const stageBadge = (stage) => {
    const map = {
        New: 'badge-new',
        Contacted: 'badge-contacted',
        Demo: 'badge-demo',
        Proposal: 'badge-proposal',
        Won: 'badge-won',
        Lost: 'badge-lost',
    }
    return map[stage] || 'badge-new'
}

/**
 * Debounce a function call.
 */
export const debounce = (fn, delay = 300) => {
    let timer
    return (...args) => {
        clearTimeout(timer)
        timer = setTimeout(() => fn(...args), delay)
    }
}

/**
 * Truncate text to a given length.
 */
export const truncate = (str, maxLength = 50) => {
    if (!str) return ''
    return str.length > maxLength ? str.slice(0, maxLength) + '...' : str
}
