<template>
  <main class="maintenance-page">
    <section class="maintenance-card">
      <p class="eyebrow">Onderhoud</p>

      <h1>{{ settings.title }}</h1>

      <p class="maintenance-message">
        {{ settings.message }}
      </p>

      <div v-if="settings.expectedBackAt || settings.contactEmail" class="maintenance-details">
        <div v-if="settings.expectedBackAt">
          <span>Verwacht terug</span>
          <strong>{{ settings.expectedBackAt }}</strong>
        </div>

        <div v-if="settings.contactEmail">
          <span>Contact</span>
          <a :href="`mailto:${settings.contactEmail}`">{{ settings.contactEmail }}</a>
        </div>
      </div>

      <RouterLink to="/login" class="admin-link">
        Admin inloggen
      </RouterLink>
    </section>
  </main>
</template>

<script setup>
defineProps({
  settings: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.maintenance-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background:
      linear-gradient(120deg, rgba(15, 23, 42, 0.82), rgba(30, 64, 175, 0.72)),
      url('../assets/home.png') center / cover;
}

.maintenance-card {
  width: min(620px, 100%);
  padding: 34px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.82);
  color: #ffffff;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.32);
  backdrop-filter: blur(16px);
}

.eyebrow {
  margin-bottom: 12px;
  color: #7dd3fc;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1 {
  margin-bottom: 16px;
  font-size: clamp(2.4rem, 6vw, 4.2rem);
  line-height: 0.98;
  letter-spacing: -0.06em;
}

.maintenance-message {
  color: #dbeafe;
  font-size: 1.08rem;
  line-height: 1.8;
  white-space: pre-wrap;
}

.maintenance-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 24px;
}

.maintenance-details div {
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
}

.maintenance-details span {
  display: block;
  margin-bottom: 6px;
  color: #bfdbfe;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.maintenance-details strong,
.maintenance-details a {
  color: #ffffff;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.admin-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  margin-top: 26px;
  padding: 0 18px;
  border-radius: 10px;
  background: #ffffff;
  color: #1d4ed8;
  font-weight: 900;
}

@media (max-width: 560px) {
  .maintenance-page {
    padding: 18px;
  }

  .maintenance-card {
    padding: 24px;
  }
}
</style>
