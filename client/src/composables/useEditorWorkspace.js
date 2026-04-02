import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useYjsEditor } from './useYjsEditor'
import { useRoomSocket } from './useRoomSocket'
import {
  getRoomById,
  updateDocumentTitle,
  saveDocumentContent,
  deleteRoom,
} from '../api/roomApi'

function applyHeadingTitleFromDocumentTitle(quillInstance, titleText) {
  if (!quillInstance || !titleText) {
    return
  }
  const cleaned = String(titleText || '').trim()
  if (cleaned === '') {
    return
  }

  const [firstLine] = quillInstance.getLine(0)
  const documentEmpty = quillInstance.getLength() <= 1 || !firstLine

  if (documentEmpty) {
    quillInstance.insertText(0, `${cleaned}\n`, { header: 1 }, 'api')
    return
  }

  const formatAtStart = quillInstance.getFormat(0, 1)
  if (formatAtStart.header !== 1) {
    return
  }

  const currentTitle = String(firstLine?.text?.() || '').trim()
  if (currentTitle !== cleaned) {
    const lineLength = firstLine.length()
    quillInstance.deleteText(0, lineLength, 'api')
    quillInstance.insertText(0, `${cleaned}\n`, { header: 1 }, 'api')
  }
}

export function useEditorWorkspace(editorHostRef) {
  const route = useRoute()
  const router = useRouter()
  const roomId = computed(() => String(route.params.roomId || ''))
  const username = ref('')
  const sessionReady = ref(false)
  const documentTitle = ref('')
  const documentTitleDraft = ref('')
  const wordCount = ref(0)
  const autoSaveLabel = ref('Saved just now')
  const syncLabel = ref('Connecting...')
  const syncDotClass = ref('status-dot status-dot-amber')

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
      router.replace('/')
      return
    }
    username.value = String(fromHistory).trim()
    try {
      const room = await getRoomById(roomId.value)
      documentTitle.value = room.title
      documentTitleDraft.value = room.title
      sessionReady.value = true
    } catch {
      router.replace('/')
    }
  })

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

  watch(
    [quill, sessionReady, documentTitle],
    ([instance, ready, titleValue]) => {
      if (!ready || !instance) {
        return
      }
      applyHeadingTitleFromDocumentTitle(instance, titleValue)
    },
    { flush: 'post' }
  )

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
    const nextTitle = documentTitleDraft.value.trim()
    if (nextTitle === '' || nextTitle === documentTitle.value) {
      documentTitleDraft.value = documentTitle.value
      return
    }
    try {
      await updateDocumentTitle(roomId.value, nextTitle)
      documentTitle.value = nextTitle
    } catch (error) {
      console.error('Failed to update room title', error)
      documentTitleDraft.value = documentTitle.value
    }
  }

  function goHome() {
    router.push('/')
  }

  async function copyShareLink() {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Copy link', url)
    }
  }

  async function endSession() {
    const confirmed = window.confirm(
      'End this session and delete the room? This cannot be undone.'
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
    wordCount,
    autoSaveLabel,
    syncLabel,
    syncDotClass,
    syncStatus,
    connectedUsers,
    undo,
    redo,
    handleTitleBlur,
    goHome,
    copyShareLink,
    endSession,
    formatRoomIdChip,
  }
}
