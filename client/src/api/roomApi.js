import axios from 'axios'

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function fetchAllRooms() {
  const response = await httpClient.get('/api/rooms')
  return response.data
}

export async function createRoom(payload) {
  const response = await httpClient.post('/api/rooms', payload)
  return response.data
}

export async function joinRoom(roomId, payload) {
  const response = await httpClient.post(
    `/api/rooms/${encodeURIComponent(roomId)}/join`,
    payload
  )
  return response.data
}

export async function getRoomById(roomId) {
  const response = await httpClient.get(
    `/api/rooms/${encodeURIComponent(roomId)}`
  )
  return response.data
}

export async function updateDocumentTitle(roomId, title) {
  const response = await httpClient.patch(
    `/api/rooms/${encodeURIComponent(roomId)}/title`,
    { title }
  )
  return response.data
}

export async function saveDocumentContent(roomId, content) {
  const response = await httpClient.patch(
    `/api/rooms/${encodeURIComponent(roomId)}/document`,
    { content }
  )
  return response.data
}
