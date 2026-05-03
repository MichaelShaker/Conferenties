<template>
  <header :class="['navbar', { 'navbar-scrolled': isScrolled }]">
    <div class="navbar-inner">
      <RouterLink to="/" class="logo">Conferenties</RouterLink>

      <nav class="nav-links">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/events">Events</RouterLink>

        <template v-if="isLoggedIn">
          <RouterLink to="/account">Account</RouterLink>
          <RouterLink to="/my-registrations">Mijn registraties</RouterLink>

          <template v-if="isAdmin">
            <RouterLink to="/admin">Admin</RouterLink>
          </template>

          <button class="logout-btn" @click="logout">
            Logout
          </button>
        </template>

        <template v-else>
          <RouterLink to="/login">Login</RouterLink>
          <RouterLink to="/register">Register</RouterLink>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { authState, clearAuth } from '../stores/auth'

const router = useRouter()

const isScrolled = ref(false)

const isLoggedIn = computed(() => !!authState.token)
const isAdmin = computed(() => authState.user?.role === 'admin')

function handleScroll() {
  isScrolled.value = window.scrollY > 40
}

function logout() {
  clearAuth()
  router.push('/')
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;

  /* 🔥 SOFT GRADIENT (matches your page) */
  background: linear-gradient(
      90deg,
      rgba(30, 41, 59, 0.95),
      rgba(51, 65, 85, 0.95)
  );

  backdrop-filter: blur(14px);

  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);

  transition: all 0.3s ease;
}

.navbar-scrolled {
  background: rgba(255, 255, 255, 0.97);
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.navbar-inner {
  width: min(1200px, 92%);
  min-height: 75px;
  margin: 0 auto;

  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 🔥 LOGO (more premium) */
.logo {
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -0.03em;

  background: linear-gradient(90deg, #38bdf8, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.navbar-scrolled .logo {
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  -webkit-background-clip: text;
}

/* NAV */
.nav-links {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 🔗 LINKS */
.nav-links a,
.logout-btn {
  padding: 8px 14px;
  border-radius: 999px;

  font-weight: 700;
  font-size: 0.95rem;

  color: rgba(255, 255, 255, 0.9);
  transition: all 0.25s ease;
}

.navbar-scrolled .nav-links a,
.navbar-scrolled .logout-btn {
  color: #475569;
}

/* ✨ HOVER (subtle glow instead of block) */
.nav-links a:hover,
.logout-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: white;
}

/* 🔥 ACTIVE (clean + modern) */
.nav-links a.router-link-active {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
}

.navbar-scrolled .nav-links a.router-link-active {
  background: #e0e7ff;
  color: #3730a3;
}

/* LOGOUT */
.logout-btn {
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.navbar-scrolled .logout-btn {
  border: 1px solid #cbd5e1;
  background: #0f172a;
  color: #cbd5e1;
}

.navbar-scrolled .logout-btn:hover {
  background: #1e293b;
  color: #ffffff;
}

/* MOBILE */
@media (max-width: 800px) {
  .navbar-inner {
    flex-direction: column;
    align-items: flex-start;
    padding: 14px 0;
  }

  .nav-links {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>