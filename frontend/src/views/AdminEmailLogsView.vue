<template>
  <main class="admin-page">
    <section class="page-head">
      <p class="eyebrow">Admin</p>
      <h1>Email geschiedenis</h1>
      <p>Controleer welke emails zijn verstuurd of mislukt.</p>
    </section>

    <StatusMessage :message="message" :success="success" />

    <section class="panel">
      <table>
        <thead>
        <tr>
          <th>Tijd</th>
          <th>Type</th>
          <th>Ontvanger</th>
          <th>Onderwerp</th>
          <th>Status</th>
          <th>Event</th>
          <th>Fout</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="log in logs" :key="log.id">
          <td>{{ formatDate(log.createdAt) }}</td>
          <td>{{ log.emailType }}</td>
          <td>{{ log.recipientEmail }}</td>
          <td>{{ log.subject }}</td>
          <td><span :class="['status', log.status]">{{ log.status }}</span></td>
          <td>{{ log.eventTitle || '-' }}</td>
          <td>{{ log.errorMessage || '-' }}</td>
        </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import StatusMessage from '../components/StatusMessage.vue'
import { fetchAdminEmailLogs } from '../services/api'

const logs = ref([])
const message = ref('')
const success = ref(false)

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('nl-NL')
}

onMounted(async () => {
  try {
    logs.value = await fetchAdminEmailLogs()
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

.status {
  padding: 7px 9px;
  border-radius: 8px;
  background: #fee2e2;
  color: #991b1b;
  font-weight: 900;
}

.status.sent {
  background: #dcfce7;
  color: #166534;
}
</style>
