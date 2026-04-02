<template>
  <div class="editor-root">
    <JoinRoomModal
      v-if="showJoinModal"
      :open="showJoinModal"
      :initialRoomId="formatRoomIdChip()"
      @close="handleJoinModalClose"
      @joined="handleDirectJoin"
    />
    <nav class="editor-nav">
      <div class="editor-nav-left">
        <button type="button" class="editor-back" @click="goHome">
          ← Home
        </button>
        <input
          v-model="documentTitleDraft"
          class="editor-title-input"
          type="text"
          aria-label="Document title"
          @blur="handleTitleBlur"
        />
        <span class="editor-room-pill mono">{{ formatRoomIdChip() }}</span>
      </div>
      <div class="editor-nav-right">
        <div class="editor-status-inline">
          <span :class="syncDotClass"></span>
          <span
            :class="
              syncStatus === 'synced' ? 'sync-label-green' : 'sync-label-amber'
            "
            >{{ syncLabel }}</span
          >
          <span>{{ connectedUsers.length }} online</span>
        </div>
        <ActiveUserAvatars :users="connectedUsers" />
        <button type="button" class="btn btn-primary" @click="copyShareLink">
          Share
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          @click="downloadDocument"
        >
          Download
        </button>
        <button type="button" class="btn btn-danger" @click="endSession">
          End session
        </button>
      </div>
    </nav>
    <div class="editor-toolbar-wrap">
      <div class="editor-history-actions">
        <button type="button" class="btn btn-ghost" @click="undo">Undo</button>
        <button type="button" class="btn btn-ghost" @click="redo">Redo</button>
      </div>
    </div>
    <div class="editor-quill-shell">
      <div class="editor-quill-inner">
        <div ref="editorHostRef"></div>
      </div>
    </div>
    <footer class="editor-statusbar">
      <div class="editor-statusbar-left">
        <span>{{ wordCount }} words</span>
        <span>{{ autoSaveLabel }}</span>
        <span
          :class="
            syncStatus === 'synced' ? 'sync-label-green' : 'sync-label-amber'
          "
          >Yjs: {{ syncLabel }}</span
        >
      </div>
      <span class="mono">{{ formatRoomIdChip() }}</span>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import ActiveUserAvatars from '../components/ActiveUserAvatars.vue'
import JoinRoomModal from '../components/JoinRoomModal.vue'
import { useEditorWorkspace } from '../composables/useEditorWorkspace'
import '../styles/editor.css'

const editorHostRef = ref(null)
const showJoinModal = ref(false)

const {
  documentTitleDraft,
  wordCount,
  autoSaveLabel,
  syncLabel,
  syncDotClass,
  syncStatus,
  connectedUsers,
  needsUsername,
  undo,
  redo,
  handleTitleBlur,
  goHome,
  copyShareLink,
  downloadDocument,
  formatRoomIdChip,
  setUsernameValue,
} = useEditorWorkspace(editorHostRef)

watch(
  needsUsername,
  (value) => {
    showJoinModal.value = value
  },
  { immediate: true }
)

function handleDirectJoin(payload) {
  showJoinModal.value = false
  setUsernameValue(payload.username).catch(() => {
    showJoinModal.value = true
  })
}

function handleJoinModalClose() {
  showJoinModal.value = false
  goHome()
}
</script>
