<template>
  <header :class="['khelwa-navbar', { solid: !isHome }]">
    <div class="nav-inner">
      <RouterLink to="/khelwa" class="logo">Khelwa</RouterLink>

      <nav>
        <RouterLink to="/khelwa">Reserveren</RouterLink>

        <template v-if="isLoggedIn">
          <RouterLink to="/khelwa/my-reservations">Mijn reserveringen</RouterLink>
          <RouterLink to="/khelwa/account">Account</RouterLink>
          <RouterLink v-if="isAdmin" to="/khelwa/admin">Admin</RouterLink>

          <button class="logout-btn" @click="logout">
            Uitloggen
          </button>
        </template>

        <template v-else>
          <RouterLink to="/khelwa/login">Inloggen</RouterLink>
          <RouterLink to="/khelwa/register">Registreren</RouterLink>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue"
import { useRouter } from "vue-router"
import { authState, clearAuth } from "../stores/auth"

defineProps({
  isHome: Boolean
})

const router = useRouter()

const isLoggedIn = computed(() => !!authState.token)
const isAdmin = computed(() => authState.user?.role === "admin")

function logout() {
  clearAuth()
  router.push("/khelwa/login")
}
</script>

<style scoped>
.khelwa-navbar {
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 20;
  transition: 0.25s ease;
}

.khelwa-navbar.solid {
  position: sticky;
  background: rgba(35, 25, 20, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.nav-inner {
  width: min(1180px, 92%);
  margin: 0 auto;
  padding: 22px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  color: white;
  text-decoration: none;
  font-size: 24px;
  font-weight: 950;
}

nav {
  display: flex;
  gap: 8px;
  padding: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  align-items: center;
}

nav a,
.logout-btn {
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-weight: 800;
  font-size: 14px;
  padding: 10px 14px;
  border-radius: 999px;
  transition: 0.2s ease;
}

.logout-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
}

nav a:hover,
nav a.router-link-active,
.logout-btn:hover {
  color: #2f241d;
  background: white;
}

@media (max-width: 760px) {
  .nav-inner {
    flex-direction: column;
    gap: 14px;
  }

  nav {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>