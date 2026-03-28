import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchAllRooms } from '../api/roomApi'

export function useLandingWorkspace() {
  const router = useRouter()
  const rooms = ref([])
  const searchQuery = ref('')
  const showCreateModal = ref(false)
  const showJoinModal = ref(false)
  const joinPrefillRoomId = ref('')

  onMounted(async () => {
    try {
      rooms.value = await fetchAllRooms()
    } catch {
      rooms.value = []
    }
  })

  function openCreateModal() {
    showCreateModal.value = true
  }

  function closeCreateModal() {
    showCreateModal.value = false
  }

  function openJoinModal(prefill) {
    joinPrefillRoomId.value = prefill ? String(prefill) : ''
    showJoinModal.value = true
  }

  function closeJoinModal() {
    showJoinModal.value = false
  }

  function handleTableRowClick(room) {
    openJoinModal(room.id)
  }

  function navigateToEditor(payload) {
    router.push({
      path: `/${payload.roomId}`,
      state: { username: payload.username },
    })
  }

  function handleRoomCreated(payload) {
    closeCreateModal()
    navigateToEditor(payload)
  }

  function handleRoomJoined(payload) {
    closeJoinModal()
    navigateToEditor(payload)
  }

  return {
    rooms,
    searchQuery,
    showCreateModal,
    showJoinModal,
    joinPrefillRoomId,
    openCreateModal,
    closeCreateModal,
    openJoinModal,
    closeJoinModal,
    handleTableRowClick,
    handleRoomCreated,
    handleRoomJoined,
  }
}
