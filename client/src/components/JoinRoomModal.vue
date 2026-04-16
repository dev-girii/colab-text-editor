<template>
  <div class="modal-overlay" @click.self="emitClose">
    <div class="modal-panel">
      <h2 class="modal-title">Join room</h2>
      <form class="field-stack" @submit.prevent="handleSubmit">
        <div>
          <label class="field-label" for="join-username">Username</label>
          <input
            id="join-username"
            v-model="usernameModel"
            class="input-field"
            type="text"
            autocomplete="username"
            required
          />
          <p v-if="usernameError" class="form-error">{{ usernameError }}</p>
        </div>
        <div>
          <label class="field-label" for="join-document">Document ID</label>
          <input
            id="join-document"
            v-model="documentIdModel"
            class="input-field mono"
            type="text"
            required
          />
        </div>
        <div>
          <label class="field-label" for="join-password">Password</label>
          <input
            id="join-password"
            v-model="passwordModel"
            class="input-field"
            type="password"
            autocomplete="current-password"
            placeholder="Leave blank if public"
          />
        </div>
        <p v-if="joinError" class="form-error">{{ joinError }}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="emitClose">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="submitting"
          >
            Join
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { joinRoom } from '../api/roomApi'
import { sanitizeRoomId, sanitizeUsername, validateUsername } from '../utils/input'

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  initialRoomId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'joined'])

const usernameModel = ref('')
const documentIdModel = ref('')
const passwordModel = ref('')
const submitting = ref(false)
const joinError = ref('')
const usernameError = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      joinError.value = ''
      usernameError.value = ''
      submitting.value = false
      documentIdModel.value = props.initialRoomId
        ? String(props.initialRoomId)
        : ''
    }
  },
  { immediate: true }
)

watch(
  () => props.initialRoomId,
  (nextId) => {
    if (props.open && nextId) {
      documentIdModel.value = String(nextId)
    }
  }
)

function emitClose() {
  emit('close')
}

async function handleSubmit() {
  joinError.value = ''
  usernameError.value = ''
  const cleanedUsername = sanitizeUsername(usernameModel.value)
  const usernameValidation = validateUsername(cleanedUsername)
  if (!usernameValidation.valid) {
    usernameError.value = usernameValidation.message
    return
  }
  usernameModel.value = cleanedUsername
  submitting.value = true
  try {
    const roomId = sanitizeRoomId(documentIdModel.value)
    await joinRoom(roomId, {
      username: cleanedUsername,
      password: passwordModel.value,
    })
    emit('joined', {
      username: cleanedUsername,
      roomId,
    })
    usernameModel.value = ''
    passwordModel.value = ''
  } catch (error) {
    const status = error && error.response && error.response.status
    if (status === 401) {
      joinError.value = 'Incorrect password'
    } else if (status === 404) {
      joinError.value = 'Room not found'
    } else {
      joinError.value = 'Could not join room'
    }
  } finally {
    submitting.value = false
  }
}
</script>
