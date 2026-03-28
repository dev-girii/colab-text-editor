<template>
  <div ref="rootRef" class="avatar-stack">
    <button
      type="button"
      class="avatar-stack-trigger"
      aria-haspopup="true"
      :aria-expanded="popoverOpen ? 'true' : 'false'"
      @click="togglePopover"
    >
      <span
        v-for="item in visibleUsers"
        :key="item.username + item.color"
        class="avatar-circle"
        :style="circleStyle(item.color)"
        >{{ initials(item.username) }}</span
      >
      <span
        v-if="overflowCount > 0"
        class="avatar-circle avatar-circle-more"
        >+{{ overflowCount }}</span
      >
    </button>
    <div v-if="popoverOpen" class="avatar-popover">
      <div
        v-for="person in props.users"
        :key="person.username + person.color"
        class="avatar-popover-row"
      >
        <span
          class="avatar-popover-dot"
          :style="dotStyle(person.color)"
        ></span>
        <span class="avatar-popover-name">{{ person.username }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  users: {
    type: Array,
    required: true,
  },
})

const rootRef = ref(null)
const popoverOpen = ref(false)

const visibleUsers = computed(() => props.users.slice(0, 3))
const overflowCount = computed(() =>
  props.users.length > 3 ? props.users.length - 3 : 0
)

function initials(value) {
  const trimmed = String(value || '').trim()
  if (trimmed === '') {
    return '?'
  }
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

function circleStyle(color) {
  return {
    background: color || '#7F77DD',
  }
}

function dotStyle(color) {
  return {
    background: color || '#7F77DD',
  }
}

function togglePopover() {
  popoverOpen.value = !popoverOpen.value
}

function handleDocumentPointerDown(event) {
  const root = rootRef.value
  if (!root) {
    return
  }
  if (!popoverOpen.value) {
    return
  }
  if (root.contains(event.target)) {
    return
  }
  popoverOpen.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentPointerDown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleDocumentPointerDown)
})
</script>
