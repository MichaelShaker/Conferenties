<template>
  <div class="app-shell">
    <AppHeader v-if="!isKhelwaPage" />
    <RouterView />
  </div>
</template>

<script setup>
import { computed } from "vue"
import { useRoute } from "vue-router"
import AppHeader from "./components/AppHeader.vue"

const route = useRoute()

const isKhelwaPage = computed(() => {
  return route.path.startsWith("/khelwa")
})
</script>