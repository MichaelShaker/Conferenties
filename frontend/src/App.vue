<template>
  <div :class="['app-shell', { 'app-shell--with-header': !isKhelwaPage }]">
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

<style scoped>
.app-shell--with-header {
  padding-top: 56px;
}

@media (max-width: 800px) {
  .app-shell--with-header {
    padding-top: 102px;
  }
}

@media (max-width: 420px) {
  .app-shell--with-header {
    padding-top: 104px;
  }
}
</style>
