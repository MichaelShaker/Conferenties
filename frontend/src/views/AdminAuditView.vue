<template>
  <main class="admin-page">
    <section class="page-head">
      <p class="eyebrow">Admin</p>
      <h1>Audit log</h1>
      <p>Bekijk belangrijke acties van admins en gebruikers.</p>
    </section>

    <StatusMessage :message="message" :success="success" />

    <section class="panel">
      <table>
        <thead>
        <tr>
          <th>Tijd</th>
          <th>Actie</th>
          <th>Door</th>
          <th>Onderdeel</th>
          <th>Details</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="log in logs" :key="log.id">
          <td>{{ formatDate(log.createdAt) }}</td>
          <td><strong>{{ log.action }}</strong></td>
          <td>{{ log.actorName || log.actorEmail || '-' }}</td>
          <td>{{ log.entityType }} #{{ log.entityId || '-' }}</td>
          <td>{{ formatDetails(log.details) }}</td>
        </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import StatusMessage from '../components/StatusMessage.vue'
import { fetchAdminAuditLogs } from '../services/api'

const logs = ref([])
const message = ref('')
const success = ref(false)

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('nl-NL')
}

function formatDetails(details) {
  if (!details) return '-'
  if (typeof details === 'string') return details
  return JSON.stringify(details)
}

onMounted(async () => {
  try {
    logs.value = await fetchAdminAuditLogs()
  } catch (error) {
    success.value = false
    message.value = error.message
  }
})
</script>

<style scoped>
.admin-page {
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

p {
  color: #64748b;
}

.panel {
  overflow-x: auto;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 14px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  vertical-align: top;
}

th {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
