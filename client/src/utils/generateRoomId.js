const allowedCharacters = 'abcdefghijkmnpqrstuvwxyz123456789'

function randomSegmentCharacter() {
  const index = Math.floor(Math.random() * allowedCharacters.length)
  return allowedCharacters[index]
}

function randomSegment(length) {
  return Array.from({ length }, randomSegmentCharacter).join('')
}

export function generateRoomId() {
  return `${randomSegment(3)}-${randomSegment(4)}-${randomSegment(2)}`
}
