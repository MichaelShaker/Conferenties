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

    <section class="maintenance-panel">
      <div class="maintenance-panel__head">
        <div>
          <p class="eyebrow">Website</p>
          <h2>Onderhoudsmodus</h2>
          <p>Zet de publieke website tijdelijk dicht en pas de melding aan die bezoekers zien.</p>
        </div>

        <label class="switch">
          <input v-model="maintenanceForm.enabled" type="checkbox" />
          <span>{{ maintenanceForm.enabled ? 'Actief' : 'Uit' }}</span>
        </label>
      </div>

      <form class="maintenance-form" @submit.prevent="saveMaintenanceSettings">
        <label>
          Titel
          <input v-model="maintenanceForm.title" type="text" maxlength="120" />
        </label>

        <label>
          Bericht
          <textarea v-model="maintenanceForm.message" maxlength="800"></textarea>
        </label>

        <div class="maintenance-form__grid">
          <label>
            Verwacht terug
            <input v-model="maintenanceForm.expectedBackAt" type="text" maxlength="120" placeholder="Bijv. vandaag rond 20:00" />
          </label>

          <label>
            Contact email
            <input v-model="maintenanceForm.contactEmail" type="email" maxlength="180" placeholder="naam@example.com" />
          </label>
        </div>

        <button type="submit" class="save-button" :disabled="savingMaintenance">
          {{ savingMaintenance ? 'Opslaan...' : 'Onderhoudsmodus opslaan' }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import StatusMessage from '../components/StatusMessage.vue'
import {
  fetchAdminMaintenanceSettings,
  fetchAdminStatus,
  updateAdminMaintenanceSettings
} from '../services/api'

const status = ref(null)
const message = ref('')
const success = ref(false)
const savingMaintenance = ref(false)
const maintenanceForm = ref({
  enabled: false,
  title: 'Tijdelijk onderhoud',
  message: 'We werken aan de website. Probeer het later opnieuw.',
  expectedBackAt: '',
  contactEmail: ''
})

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
    const [statusResult, maintenanceResult] = await Promise.all([
      fetchAdminStatus(),
      fetchAdminMaintenanceSettings()
    ])

    status.value = statusResult
    maintenanceForm.value = maintenanceResult
    success.value = true
  } catch (error) {
    success.value = false
    message.value = error.message
  }
})

async function saveMaintenanceSettings() {
  savingMaintenance.value = true
  message.value = ''

  try {
    maintenanceForm.value = await updateAdminMaintenanceSettings(maintenanceForm.value)
    success.value = true
    message.value = 'Onderhoudsmodus is opgeslagen.'
  } catch (error) {
    success.value = false
    message.value = error.message
  } finally {
    savingMaintenance.value = false
  }
}
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
.status-panel,
.maintenance-panel {
  padding: 22px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
}

.maintenance-panel {
  margin-top: 22px;
}

.maintenance-panel__head {
  display: flex;
  justify-content: space-between;
  gap: 22px;
  margin-bottom: 22px;
}

.maintenance-panel__head h2 {
  margin-bottom: 8px;
  color: #0f172a;
  font-size: 1.8rem;
}

.switch {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  color: #0f172a;
}

.switch input {
  width: 22px;
  height: 22px;
  accent-color: #2563eb;
}

.maintenance-form {
  display: grid;
  gap: 16px;
}

.maintenance-form label {
  display: grid;
  gap: 8px;
  color: #334155;
  font-weight: 900;
}

.maintenance-form input,
.maintenance-form textarea {
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  color: #0f172a;
  font: inherit;
}

.maintenance-form textarea {
  min-height: 130px;
  resize: vertical;
}

.maintenance-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.save-button {
  justify-self: flex-start;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  font-weight: 900;
}

.save-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
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
  .metric-grid,
  .maintenance-form__grid {
    grid-template-columns: 1fr;
  }

  .maintenance-panel__head {
    flex-direction: column;
  }
}
</style>
