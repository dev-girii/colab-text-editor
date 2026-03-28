<template>
  <div class="landing-root">
    <header class="landing-nav">
      <div class="landing-logo">
        collab<span class="landing-logo-accent">docs</span>
      </div>
      <div class="landing-nav-actions">
        <button type="button" class="btn btn-ghost" @click="openJoinModal('')">
          Join room
        </button>
        <button type="button" class="btn btn-secondary" @click="openCreateModal">
          Create room
        </button>
      </div>
    </header>
    <section class="landing-hero">
      <h1 class="landing-hero-title">Real-time collaborative editing</h1>
      <p class="landing-hero-sub">
        Create a room, share the link, and edit together — instantly.
      </p>
      <div class="landing-hero-actions">
        <button type="button" class="btn btn-ghost" @click="openJoinModal('')">
          Join room
        </button>
        <button type="button" class="btn btn-secondary" @click="openCreateModal">
          Create room
        </button>
      </div>
    </section>
    <section class="landing-rooms">
      <div class="landing-rooms-header">
        <p class="landing-rooms-label">Active rooms</p>
        <input
          v-model="searchQuery"
          class="input-field landing-search"
          type="search"
          placeholder="Search by room ID or title"
          aria-label="Search rooms"
        />
      </div>
      <RoomTable
        :rooms="rooms"
        :search-query="searchQuery"
        @row-click="handleTableRowClick"
      />
    </section>
    <CreateRoomModal
      v-if="showCreateModal"
      :open="showCreateModal"
      @close="closeCreateModal"
      @created="handleRoomCreated"
    />
    <JoinRoomModal
      v-if="showJoinModal"
      :open="showJoinModal"
      :initial-room-id="joinPrefillRoomId"
      @close="closeJoinModal"
      @joined="handleRoomJoined"
    />
  </div>
</template>

<script setup>
import RoomTable from '../components/RoomTable.vue'
import JoinRoomModal from '../components/JoinRoomModal.vue'
import CreateRoomModal from '../components/CreateRoomModal.vue'
import { useLandingWorkspace } from '../composables/useLandingWorkspace'
import '../styles/landing.css'

const {
  rooms,
  searchQuery,
  showCreateModal,
  showJoinModal,
  joinPrefillRoomId,
  openCreateModal,
  closeCreateModal,
  openJoinModal,
  closeJoinModal,
  handleTableRowClick,
  handleRoomCreated,
  handleRoomJoined,
} = useLandingWorkspace()
</script>
