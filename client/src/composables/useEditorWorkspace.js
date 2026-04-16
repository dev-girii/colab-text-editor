import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useYjsEditor } from './useYjsEditor'
import { useRoomSocket } from './useRoomSocket'
import {
  getRoomById,
  getRevisions,
  updateDocumentTitle,
  saveDocumentContent,
  deleteRoom,
} from '../api/roomApi'
import { sanitizeTitle, sanitizeUsername, validateTitle, validateUsername } from '../utils/input'

export function useEditorWorkspace(editorHostRef) {
  const route = useRoute()
  const router = useRouter()
  const roomId = computed(() => String(route.params.roomId || ''))
  const username = ref('')
  const sessionReady = ref(false)
  const needsUsername = ref(false)
  const documentTitle = ref('')
  const documentTitleDraft = ref('')
  const roomOwner = ref('')
  const isRoomOwner = computed(() => roomOwner.value !== '' && roomOwner.value === username.value)
  const wordCount = ref(0)
  const autoSaveLabel = ref('Saved just now')
  const syncLabel = ref('Connecting...')
  const syncDotClass = ref('status-dot status-dot-amber')
  const showRevisions = ref(false)
  const revisions = ref([])
  const revisionsError = ref('')

  onMounted(async () => {
    const historyState = window.history.state
    const fromHistory =
      historyState &&
      Object.prototype.hasOwnProperty.call(historyState, 'username')
        ? historyState.username
        : undefined
    if (
      fromHistory === undefined ||
      fromHistory === null ||
      String(fromHistory).trim() === ''
    ) {
      needsUsername.value = true
      return
    }
    username.value = sanitizeUsername(fromHistory)
    try {
      const room = await getRoomById(roomId.value)
      documentTitle.value = room.title
      documentTitleDraft.value = room.title
      roomOwner.value = room.createdBy || ''
      sessionReady.value = true
    } catch {
      router.replace('/')
    }
  })

  async function setUsernameValue(nextUsername) {
    const cleaned = sanitizeUsername(nextUsername)
    const usernameValidation = validateUsername(cleaned)
    if (!usernameValidation.valid) {
      throw new Error('Username is required')
    }
    username.value = cleaned
    needsUsername.value = false
    try {
      const room = await getRoomById(roomId.value)
      documentTitle.value = room.title
      documentTitleDraft.value = room.title
      roomOwner.value = room.createdBy || ''
      sessionReady.value = true
      window.history.replaceState({ username: cleaned }, '', window.location.href)
    } catch (error) {
      needsUsername.value = true
      router.replace('/')
      throw error
    }
  }

  const { quill, provider, syncStatus, undo, redo } = useYjsEditor({
    roomId,
    username,
    editorContainer: editorHostRef,
    sessionReady,
  })

  const { connectedUsers } = useRoomSocket({
    roomId,
    username,
    providerRef: provider,
  })

  let detachQuillSideEffects = () => {}

  watch(
    quill,
    (instance) => {
      detachQuillSideEffects()
      detachQuillSideEffects = () => {}
      if (!instance) {
        return
      }
      let debounceTimer = null
      const clearTimer = () => {
        if (debounceTimer !== null) {
          clearTimeout(debounceTimer)
          debounceTimer = null
        }
      }
      const scheduleSave = () => {
        clearTimer()
        autoSaveLabel.value = 'Saving...'
        debounceTimer = setTimeout(async () => {
          try {
            await saveDocumentContent(roomId.value, instance.root.innerHTML)
            autoSaveLabel.value = 'Saved just now'
          } catch {
            autoSaveLabel.value = 'Save failed'
          }
        }, 3000)
      }
      const handleTextChange = () => {
        const rawText = instance.getText()
        const trimmed = rawText.trim()
        wordCount.value =
          trimmed.length === 0 ? 0 : trimmed.split(/\s+/).filter(Boolean).length
        scheduleSave()
      }
      instance.on('text-change', handleTextChange)
      handleTextChange()
      detachQuillSideEffects = () => {
        clearTimer()
        instance.off('text-change', handleTextChange)
      }
    },
    { flush: 'post' }
  )

  onUnmounted(() => {
    detachQuillSideEffects()
  })

  watch(syncStatus, (value) => {
    if (value === 'synced') {
      syncLabel.value = 'Synced'
      syncDotClass.value = 'status-dot status-dot-green'
    } else {
      syncLabel.value = 'Connecting...'
      syncDotClass.value = 'status-dot status-dot-amber'
    }
  })

  function formatRoomIdChip() {
    return roomId.value || ''
  }

  async function handleTitleBlur() {
    const cleanedTitle = sanitizeTitle(documentTitleDraft.value)
    const titleValidation = validateTitle(cleanedTitle)
    if (!titleValidation.valid) {
      documentTitleDraft.value = documentTitle.value
      return
    }
    if (cleanedTitle === documentTitle.value) {
      documentTitleDraft.value = documentTitle.value
      return
    }
    try {
      if (!isRoomOwner.value) {
        documentTitleDraft.value = documentTitle.value
        return
      }
      const cleanedUsername = sanitizeUsername(username.value)
      const usernameValidation = validateUsername(cleanedUsername)
      if (!usernameValidation.valid) {
        documentTitleDraft.value = documentTitle.value
        return
      }
      await updateDocumentTitle(roomId.value, cleanedTitle, cleanedUsername)
      documentTitle.value = cleanedTitle
    } catch (error) {
      console.error('Failed to update room title', error)
      documentTitleDraft.value = documentTitle.value
    }
  }

  async function refreshRevisions() {
    revisionsError.value = ''
    try {
      revisions.value = await getRevisions(roomId.value)
    } catch {
      revisionsError.value = 'Unable to load revisions'
      revisions.value = []
    }
  }

  async function openRevisions() {
    showRevisions.value = true
    await refreshRevisions()
  }

  function closeRevisions() {
    showRevisions.value = false
  }

  function goHome() {
    router.push('/')
  }

  async function copyShareLink() {
    const roomIdentifier = roomId.value || ''
    if (!roomIdentifier) {
      window.alert('Room ID not available')
      return
    }
    try {
      await navigator.clipboard.writeText(roomIdentifier)
      window.alert('Document ID copied to clipboard')
    } catch {
      window.prompt('Copy document ID', roomIdentifier)
    }
  }

  function downloadDocument() {
    const instance = quill.value
    if (!instance) {
      window.alert('Editor is not ready yet')
      return
    }
    const content = instance.root.innerHTML
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${roomId.value || 'document'}.html`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    window.alert('Document downloaded successfully')
  }

  async function endSession() {
    const hasDownloaded = window.confirm(
      'Have you downloaded the document? Press OK if you have already downloaded it, or Cancel if you need to download it first.'
    )
    if (!hasDownloaded) {
      const downloadNow = window.confirm(
        'Would you like to download the document now?'
      )
      if (downloadNow) {
        downloadDocument()
      } else {
        return
      }
    }
    const confirmed = window.confirm(
      'Are you sure you want to end this session and delete the room? This cannot be undone.'
    )
    if (!confirmed) {
      return
    }
    try {
      await deleteRoom(roomId.value)
      router.push('/')
    } catch (error) {
      console.error('Failed to delete room', error)
      window.alert('Unable to end session. Please try again later.')
    }
  }

  return {
    roomId,
    documentTitleDraft,
    roomOwner,
    isRoomOwner,
    wordCount,
    autoSaveLabel,
    syncLabel,
    syncDotClass,
    syncStatus,
    connectedUsers,
    needsUsername,
    sessionReady,
    showRevisions,
    revisions,
    revisionsError,
    undo,
    redo,
    handleTitleBlur,
    goHome,
    copyShareLink,
    openRevisions,
    closeRevisions,
    downloadDocument,
    endSession,
    formatRoomIdChip,
    setUsernameValue,
  }
}
