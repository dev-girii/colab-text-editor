import { ref, watch, onUnmounted } from 'vue'

export function useRoomSocket({ roomId, username, providerRef }) {
  const connectedUsers = ref([])
  let detach = () => {}

  const stopWatch = watch(
    () => [providerRef.value, roomId.value, username.value],
    ([activeProvider]) => {
      detach()
      detach = () => {}
      if (!activeProvider) {
        connectedUsers.value = []
        return
      }
      const handleAwarenessChange = () => {
        const list = []
        activeProvider.awareness.getStates().forEach((state) => {
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
      activeProvider.awareness.on('change', handleAwarenessChange)
      handleAwarenessChange()
      detach = () => {
        activeProvider.awareness.off('change', handleAwarenessChange)
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    stopWatch()
    detach()
  })

  return { connectedUsers }
}
