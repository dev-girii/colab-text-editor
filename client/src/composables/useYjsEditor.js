import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { QuillBinding } from 'y-quill'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import { ref, shallowRef, watch, onUnmounted } from 'vue'
import { saveRevision } from '../api/roomApi'

Quill.register('modules/cursors', QuillCursors)

const userColors = [
  '#7F77DD',
  '#1D9E75',
  '#D85A30',
  '#e056fd',
  '#686de0',
  '#f9ca24',
  '#6ab04c',
]

function readRefOrValue(source) {
  if (source && typeof source === 'object' && 'value' in source) {
    return source.value
  }
  return source
}

export function useYjsEditor({
  roomId,
  username,
  editorContainer,
  sessionReady,
}) {
  const quill = shallowRef(null)
  const provider = shallowRef(null)
  const connectedUsers = ref([])
  const syncStatus = ref('connecting')

  let binding = null
  let revisionIntervalId = null
  let teardown = () => {}

  const stopCompositionWatch = watch(
    () => [
      sessionReady.value,
      editorContainer.value,
      readRefOrValue(roomId),
    ],
    () => {
      teardown()
      teardown = () => {}
      if (!sessionReady.value || !editorContainer.value) {
        return
      }
      const resolvedRoomId = readRefOrValue(roomId)
      if (!resolvedRoomId) {
        return
      }
      const displayName = readRefOrValue(username)
      if (!displayName) {
        return
      }
      try {
        const host = editorContainer.value
        const yDocument = new Y.Doc()
        const yText = yDocument.getText('quill')
        const websocketUrl = import.meta.env.VITE_WS_URL
        const websocketProvider = new WebsocketProvider(
          websocketUrl,
          resolvedRoomId,
          yDocument
        )
      const randomColor =
        userColors[Math.floor(Math.random() * userColors.length)]
      websocketProvider.awareness.setLocalStateField('user', {
        name: displayName,
        username: displayName,
        color: randomColor,
      })
      const quillInstance = new Quill(host, {
        theme: 'snow',
        modules: {
          history: {
            delay: 500,
            maxStack: 500,
          },
          cursors: true,
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            [{ font: [] }],
            [{ size: ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ align: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['code-block'],
          ],
        },
      })
      binding = new QuillBinding(
        yText,
        quillInstance,
        websocketProvider.awareness
      )
      quill.value = quillInstance
      provider.value = websocketProvider

      revisionIntervalId = setInterval(async () => {
        const editor = quill.value
        const currentProvider = provider.value
        if (!editor || !currentProvider) {
          return
        }
        try {
          await saveRevision(resolvedRoomId, {
            content: editor.root.innerHTML,
            savedBy: displayName,
          })
        } catch {}
      }, 5 * 60 * 1000)

      const updateUsers = () => {
        const list = []
        websocketProvider.awareness.getStates().forEach((state) => {
          const userBlock = state && state.user
          if (userBlock && userBlock.username) {
            list.push({
              username: String(userBlock.username),
              color: userBlock.color,
            })
          }
        })
        connectedUsers.value = list
      }

      const handleAwarenessChange = () => {
        updateUsers()
      }

      const handleStatus = (event) => {
        if (event.status === 'connected') {
          syncStatus.value = websocketProvider.synced ? 'synced' : 'connecting'
        } else if (event.status === 'disconnected') {
          syncStatus.value = 'connecting'
        } else {
          syncStatus.value = 'connecting'
        }
      }

      const handleSync = (isSynced) => {
        syncStatus.value = isSynced ? 'synced' : 'connecting'
      }

      websocketProvider.on('status', handleStatus)
      websocketProvider.on('sync', handleSync)
      websocketProvider.awareness.on('change', handleAwarenessChange)
      updateUsers()

      teardown = () => {
        if (revisionIntervalId !== null) {
          clearInterval(revisionIntervalId)
          revisionIntervalId = null
        }
        websocketProvider.awareness.off('change', handleAwarenessChange)
        websocketProvider.off('status', handleStatus)
        websocketProvider.off('sync', handleSync)
        if (binding && typeof binding.destroy === 'function') {
          binding.destroy()
        }
        binding = null
        websocketProvider.destroy()
        quill.value = null
        provider.value = null
      }
    } catch (error) {
      console.error('[Yjs] Failed to initialize editor', error)
      syncStatus.value = 'error'
      connectedUsers.value = []
      teardown = () => {}
    }
    },
    { flush: 'post' }
  )

  const stopUsernameWatch = watch(
    () => readRefOrValue(username),
    (nextName) => {
      const activeProvider = provider.value
      if (!activeProvider || !nextName) {
        return
      }
      const localState = activeProvider.awareness.getLocalState() || {}
      const priorUser = localState.user || {}
      const existingColor = priorUser.color
      const nextColor =
        existingColor ||
        userColors[Math.floor(Math.random() * userColors.length)]
      activeProvider.awareness.setLocalStateField('user', {
        name: nextName,
        username: nextName,
        color: nextColor,
      })
    }
  )

  onUnmounted(() => {
    stopCompositionWatch()
    stopUsernameWatch()
    teardown()
  })

  function undo() {
    const instance = quill.value
    if (instance && instance.history) {
      instance.history.undo()
    }
  }

  function redo() {
    const instance = quill.value
    if (instance && instance.history) {
      instance.history.redo()
    }
  }

  return {
    quill,
    provider,
    connectedUsers,
    syncStatus,
    undo,
    redo,
  }
}
