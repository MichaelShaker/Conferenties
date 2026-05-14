<template>
  <main class="status-page">
    <section class="page-head">
      <p class="eyebrow">Admin</p>
      <h1>Systeemstatus</h1>
      <p>Controleer snel of database, mail en Google Sheets klaar zijn.</p>
    </section>

    <StatusMessage :message="message" :success="success" />

    <section v-if="status" class="status-grid">
      <article v-for="(check, key) in status.checks" :key="key" class="status-card">
        <span :class="['dot', { ok: check.ok }]"></span>
        <h2>{{ labels[key] || key }}</h2>
        <p>{{ check.message }}</p>
        <small v-if="check.email">{{ check.email }}</small>
      </article>
    </section>

    <section v-if="status" class="metric-grid">
      <div>
        <span>Actieve events</span>
        <strong>{{ status.metrics.activeEvents }}</strong>
      </div>
      <div>
        <span>Actieve registraties</span>
        <strong>{{ status.metrics.activeRegistrations }}</strong>
      </div>
      <div>
        <span>Mislukte emails</span>
        <strong>{{ status.metrics.failedEmails }}</strong>
      </div>
      <div>
        <span>Sheet sync fouten</span>
        <strong>{{ status.metrics.sheetSyncErrors }}</strong>
      </div>
    </section>

    <section v-if="status" class="status-panel">
      <h2>Laatste activiteit</h2>
      <p>Laatste email: {{ formatDate(status.metrics.lastEmailAt) }}</p>
      <p>Laatste Google Sheet sync: {{ formatDate(status.metrics.lastSheetSyncAt) }}</p>
      <p>Omgeving: {{ status.app.environment }}</p>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import StatusMessage from '../components/StatusMessage.vue'
import { fetchAdminStatus } from '../services/api'

const status = ref(null)
const message = ref('')
const success = ref(false)

const labels = {
  database: 'Database',
  mail: 'Email',
  googleSheets: 'Google Sheets'
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('nl-NL')
}

onMounted(async () => {
  try {
    status.value = await fetchAdminStatus()
    success.value = true
  } catch (error) {
    success.value = false
    message.value = error.message
  }
})
</script>

<style scoped>
.status-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 80px max(4vw, 28px);
}

.page-head {
  max-width: 820px;
  margin-bottom: 28px;
}

.eyebrow {
  margin-bottom: 10px;
  color: #2563eb;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h1 {
  margin-bottom: 10px;
  color: #0f172a;
  font-size: clamp(2.6rem, 6vw, 5rem);
  line-height: 0.95;
}

.page-head p,
.status-card p,
.status-panel p {
  color: #64748b;
  line-height: 1.6;
}

.status-grid,
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}

.metric-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.status-card,
.metric-grid div,
.status-panel {
  padding: 22px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
}

.dot {
  width: 12px;
  height: 12px;
  display: inline-block;
  margin-bottom: 12px;
  border-radius: 999px;
  background: #ef4444;
}

.dot.ok {
  background: #16a34a;
}

.status-card h2 {
  color: #0f172a;
}

.metric-grid span {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.metric-grid strong {
  color: #0f172a;
  font-size: 2.2rem;
}

@media (max-width: 850px) {
  .status-grid,
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
