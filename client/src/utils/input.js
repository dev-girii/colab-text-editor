function stripControlCharacters(value) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, '')
}

function collapseWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

export function sanitizeUsername(value) {
  return collapseWhitespace(stripControlCharacters(value))
}

export function sanitizeTitle(value) {
  return collapseWhitespace(stripControlCharacters(value))
}

export function sanitizeRoomId(value) {
  return stripControlCharacters(value).trim()
}

export function validateUsername(value) {
  const cleaned = sanitizeUsername(value)
  if (cleaned === '') {
    return { valid: false, message: 'Username is required' }
  }
  if (cleaned.length > 30) {
    return { valid: false, message: 'Username must be at most 30 characters' }
  }
  return { valid: true, message: '' }
}

export function validateTitle(value) {
  const cleaned = sanitizeTitle(value)
  if (cleaned === '') {
    return { valid: false, message: 'Title is required' }
  }
  if (cleaned.length > 100) {
    return { valid: false, message: 'Title must be at most 100 characters' }
  }
  return { valid: true, message: '' }
}

export function validatePassword(value) {
  const cleaned = stripControlCharacters(value)
  if (cleaned.length > 0 && cleaned.length < 4) {
    return { valid: false, message: 'Password must be at least 4 characters' }
  }
  return { valid: true, message: '' }
}
