import axios from 'axios'
import { computed, ref } from 'vue'

const loadingCount = ref(0)
export const isHttpLoading = computed(() => loadingCount.value > 0)

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

httpClient.interceptors.request.use(
  (config) => {
    loadingCount.value += 1
    return config
  },
  (error) => {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
    return Promise.reject(error)
  }
)

httpClient.interceptors.response.use(
  (response) => {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
    return response
  },
  (error) => {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
    return Promise.reject(error)
  }
)

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

export async function updateDocumentTitle(roomId, title, username) {
  const response = await httpClient.patch(
    `/api/rooms/${encodeURIComponent(roomId)}/title`,
    { title, username }
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

export async function saveRevision(roomId, payload) {
  const response = await httpClient.post(
    `/api/rooms/${encodeURIComponent(roomId)}/revisions`,
    payload
  )
  return response.data
}

export async function getRevisions(roomId) {
  const response = await httpClient.get(
    `/api/rooms/${encodeURIComponent(roomId)}/revisions`
  )
  return response.data
}

export async function deleteRoom(roomId) {
  const response = await httpClient.delete(
    `/api/rooms/${encodeURIComponent(roomId)}`
  )
  return response.data
}
