<template>
  <div :class="['app-shell', { 'app-shell--with-header': !isKhelwaPage && !showMaintenance }]">
    <MaintenanceMode
      v-if="showMaintenance"
      :settings="maintenanceSettings"
    />

    <template v-else>
      <AppHeader v-if="!isKhelwaPage" />
      <RouterView />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import AppHeader from "./components/AppHeader.vue"
import MaintenanceMode from "./components/MaintenanceMode.vue"
import { authState } from "./stores/auth"
import { fetchMaintenanceSettings } from "./services/api"

const route = useRoute()
const maintenanceSettings = ref({
  enabled: false,
  title: "Tijdelijk onderhoud",
  message: "We werken aan de website. Probeer het later opnieuw.",
  expectedBackAt: "",
  contactEmail: ""
})

const isKhelwaPage = computed(() => {
  return route.path.startsWith("/khelwa")
})

const isAdmin = computed(() => authState.user?.role === "admin")

const isMaintenanceAllowedRoute = computed(() => {
  return route.path.startsWith("/login")
      || route.path.startsWith("/forgot-password")
      || route.path.startsWith("/reset-password")
})

const showMaintenance = computed(() => {
  return maintenanceSettings.value.enabled
      && !isAdmin.value
      && !isMaintenanceAllowedRoute.value
})

async function loadMaintenanceSettings() {
  try {
    maintenanceSettings.value = await fetchMaintenanceSettings()
  } catch (error) {
    maintenanceSettings.value = {
      ...maintenanceSettings.value,
      enabled: false
    }
  }
}

onMounted(loadMaintenanceSettings)

watch(() => route.fullPath, loadMaintenanceSettings)
</script>

<style scoped>
.app-shell--with-header {
  padding-top: 50px;
}

@media (max-width: 800px) {
  .app-shell--with-header {
    padding-top: 90px;
  }
}

@media (max-width: 420px) {
  .app-shell--with-header {
    padding-top: 90px;
  }
}
</style>
