<template>
  <div v-if="message" :class="['message', success ? 'message-success' : 'message-error']">
    <template v-for="(line, index) in messageLines" :key="`${line}-${index}`">
      <strong v-if="index === 0">{{ line }}</strong>
      <span v-else>{{ line }}</span>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: String,
    default: ''
  },
  success: {
    type: Boolean,
    default: false
  }
})

const messageLines = computed(() => props.message.split('\n').filter(Boolean))
</script>
