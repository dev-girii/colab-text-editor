<template>
  <div class="modal-overlay" @click.self="emitClose">
    <div class="modal-panel">
      <h2 class="modal-title">Create room</h2>
      <form class="field-stack" @submit.prevent="handleSubmit">
        <div>
          <label class="field-label" for="create-username">Username</label>
          <input
            id="create-username"
            v-model="usernameModel"
            class="input-field"
            type="text"
            autocomplete="username"
            required
          />
        </div>
        <div>
          <label class="field-label" for="create-title">Document title</label>
          <input
            id="create-title"
            v-model="titleModel"
            class="input-field"
            type="text"
            required
          />
        </div>
        <div>
          <span class="field-label">Room ID</span>
          <div class="room-id-preview">
            <div class="room-id-preview-value">{{ previewRoomId }}</div>
            <button
              type="button"
              class="btn btn-ghost btn-small"
              @click="regeneratePreviewId"
            >
              Regen
            </button>
          </div>
        </div>
        <div class="toggle-row">
          <span class="field-label field-label-flatten">Password protect</span>
          <label class="toggle-switch">
            <input v-model="passwordEnabledModel" type="checkbox" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div v-if="passwordEnabledModel">
          <label class="field-label" for="create-password">Password</label>
          <input
            id="create-password"
            v-model="passwordModel"
            class="input-field"
            type="password"
            autocomplete="new-password"
          />
        </div>
        <p v-if="submitError" class="form-error">{{ submitError }}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="emitClose">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-secondary"
            :disabled="submitting"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { createRoom } from '../api/roomApi'
import { generateRoomId } from '../utils/generateRoomId'

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['close', 'created'])

const usernameModel = ref('')
const titleModel = ref('')
const passwordModel = ref('')
const passwordEnabledModel = ref(false)
const previewRoomId = ref(generateRoomId())
const submitting = ref(false)
const submitError = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      submitError.value = ''
      submitting.value = false
      previewRoomId.value = generateRoomId()
    }
  },
  { immediate: true }
)

function emitClose() {
  emit('close')
}

function regeneratePreviewId() {
  previewRoomId.value = generateRoomId()
}

async function handleSubmit() {
  submitError.value = ''
  submitting.value = true
  try {
    const payload = {
      title: titleModel.value.trim(),
    }
    if (passwordEnabledModel.value && passwordModel.value) {
      payload.password = passwordModel.value
    }
    const room = await createRoom(payload)
    emit('created', {
      username: usernameModel.value.trim(),
      roomId: room.id,
    })
    usernameModel.value = ''
    titleModel.value = ''
    passwordModel.value = ''
    passwordEnabledModel.value = false
  } catch {
    submitError.value = 'Could not create room'
  } finally {
    submitting.value = false
  }
}
</script>
