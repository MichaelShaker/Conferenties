<template>
  <main class="admin-page">
    <section class="page-head">
      <p class="eyebrow">Admin</p>
      <h1>Gebruikers</h1>
      <p>Beheer rollen, nieuwsbriefvoorkeuren en profielstatus.</p>
    </section>

    <StatusMessage :message="message" :success="success" />

    <section class="panel">
      <table>
        <thead>
        <tr>
          <th>Naam</th>
          <th>Email</th>
          <th>Rol</th>
          <th>Profiel</th>
          <th>Kerk/stad</th>
          <th>Emails</th>
          <th>Registraties</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="user in users" :key="user.id">
          <td><strong>{{ user.name }}</strong></td>
          <td>{{ user.email }}</td>
          <td>
            <select v-model="user.role" @change="saveUser(user)">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </td>
          <td>{{ user.profileCompleted ? 'Compleet' : 'Mist gegevens' }}</td>
          <td>{{ user.churchName || '-' }}<br>{{ user.city || '-' }}</td>
          <td>
            <label class="toggle">
              <input
                  type="checkbox"
                  :checked="user.newsletterEnabled === 1"
                  @change="toggleNewsletter(user, $event.target.checked)"
              />
              <span>{{ user.newsletterEnabled === 1 ? 'Aan' : 'Uit' }}</span>
            </label>
          </td>
          <td>{{ user.registrationCount }}</td>
        </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import StatusMessage from '../components/StatusMessage.vue'
import { fetchAdminUsers, updateAdminUser } from '../services/api'

const users = ref([])
const message = ref('')
const success = ref(false)

async function loadUsers() {
  users.value = await fetchAdminUsers()
}

async function saveUser(user) {
  try {
    const response = await updateAdminUser(user.id, { role: user.role })
    Object.assign(user, response.data)
    success.value = true
    message.value = 'Gebruiker bijgewerkt.'
  } catch (error) {
    success.value = false
    message.value = error.message
    await loadUsers()
  }
}

async function toggleNewsletter(user, enabled) {
  try {
    const response = await updateAdminUser(user.id, { newsletterEnabled: enabled })
    Object.assign(user, response.data)
    success.value = true
    message.value = 'Emailvoorkeur bijgewerkt.'
  } catch (error) {
    success.value = false
    message.value = error.message
    await loadUsers()
  }
}

onMounted(async () => {
  try {
    await loadUsers()
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

select {
  min-height: 38px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
}
</style>
