<template>
  <div v-if="message" :class="['message', success ? 'message-success' : 'message-error']">
    {{ message }}
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: ''
  },
  success: {
    type: Boolean,
    default: false
  }
})
</script>