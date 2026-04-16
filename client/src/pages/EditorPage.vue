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
          :disabled="!isRoomOwner"
          @blur="handleTitleBlur"
        />
        <span v-if="roomOwner" class="editor-owner-tag">
          Owner: <span class="mono">{{ roomOwner }}</span>
        </span>
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
        <button type="button" class="btn btn-ghost" @click="openRevisions">
          Revisions
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
    <div v-if="showRevisions" class="modal-overlay" @click.self="closeRevisions">
      <div class="modal-panel">
        <h2 class="modal-title">Revisions</h2>
        <p v-if="revisionsError" class="form-error">{{ revisionsError }}</p>
        <div
          v-if="revisions.length === 0 && !revisionsError"
          class="revisions-empty"
        >
          No revisions yet
        </div>
        <div v-else class="revisions-list">
          <div
            v-for="revision in revisions"
            :key="revision.id"
            class="revision-row"
          >
            <div class="revision-meta">
              <span class="mono">{{ revision.savedBy }}</span>
              <span class="revision-time">{{
                formatRevisionTime(revision.createdAt)
              }}</span>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="closeRevisions">
            Close
          </button>
        </div>
      </div>
    </div>
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
  roomOwner,
  isRoomOwner,
  needsUsername,
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
} = useEditorWorkspace(editorHostRef)

function formatRevisionTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleString()
}

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
