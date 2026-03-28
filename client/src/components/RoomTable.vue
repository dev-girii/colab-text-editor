<template>
  <div class="room-table-wrap">
    <table class="room-table">
      <thead>
        <tr>
          <th>Room ID</th>
          <th>Title</th>
          <th>Users online</th>
          <th>Access</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="room in filteredRooms"
          :key="room.id"
          @click="emitRowClick(room)"
        >
          <td class="mono">{{ room.id }}</td>
          <td>{{ room.title }}</td>
          <td>{{ room.activeUsers ?? 0 }}</td>
          <td>
            <span v-if="room.isProtected" class="badge badge-lock"
              >Password</span
            >
            <span v-else class="badge badge-public">Public</span>
          </td>
          <td>{{ formatCreatedAt(room.createdAt) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rooms: {
    type: Array,
    required: true,
  },
  searchQuery: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['row-click'])

const filteredRooms = computed(() => {
  const needle = props.searchQuery.trim().toLowerCase()
  if (needle === '') {
    return props.rooms
  }
  return props.rooms.filter((room) => {
    const idMatch = String(room.id).toLowerCase().includes(needle)
    const titleMatch = String(room.title).toLowerCase().includes(needle)
    return idMatch || titleMatch
  })
})

function formatCreatedAt(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleString()
}

function emitRowClick(room) {
  emit('row-click', room)
}
</script>
