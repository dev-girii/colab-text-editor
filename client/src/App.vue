<template>
  <router-view />
  <div v-if="isHttpLoading" class="global-loader-overlay">
    <div class="global-loader-panel">
      <div class="global-loader-spinner"></div>
      <p>Loading...</p>
    </div>
  </div>
</template>

<script setup>
import { isHttpLoading } from './api/roomApi'
</script>
