<template>
  <main class="admin-registrations">
    <!-- HERO -->
    <section class="registrations-hero">
      <div>
        <p class="eyebrow">Admin - Registraties</p>

        <h1>Beheer inschrijvingen en betalingen.</h1>

        <p>
          Controleer betaalbewijzen, keur registraties goed en houd overzicht over
          alle aanmeldingen.
        </p>
      </div>

      <div class="hero-count">
        <strong>{{ registrations.length }}</strong>
        <span>registraties</span>
      </div>
    </section>

    <StatusMessage :message="message" :success="success" />

    <!-- NO ACCESS -->
    <section v-if="!isAdmin" class="access-card">
      <h2>Geen toegang</h2>
      <p>Je hebt geen toegang tot deze pagina.</p>
    </section>

    <!-- CONTENT -->
    <section v-else class="registrations-content">
      <!-- SUMMARY -->
      <div class="summary-grid">
        <div>
          <span>Totaal</span>
          <strong>{{ registrations.length }}</strong>
          <p>Alle registraties</p>
        </div>

        <div>
          <span>Wacht op betaling</span>
          <strong>{{ pendingCount }}</strong>
          <p>Nog geen bewijs</p>
        </div>

        <div>
          <span>Te controleren</span>
          <strong>{{ proofUploadedCount }}</strong>
          <p>Bewijs geüpload</p>
        </div>

        <div>
          <span>Bevestigd</span>
          <strong>{{ confirmedCount }}</strong>
          <p>Goedgekeurd</p>
        </div>
      </div>

      <!-- TABLE -->
      <section class="registrations-panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Overzicht</p>
            <h2>Alle registraties</h2>
            <p>Controleer per gebruiker de status en betaalinformatie.</p>
          </div>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
            <tr>
              <th>Gebruiker</th>
              <th>Event</th>
              <th>Datum</th>
              <th>Betaalstatus</th>
              <th>Registratie</th>
              <th>Betaalbewijs</th>
              <th>Actie</th>
            </tr>
            </thead>

            <tbody>
            <tr v-for="registration in registrations" :key="registration.id">
              <td>
                <div class="user-cell">
                  <strong>{{ registration.userName }}</strong>
                  <span>{{ registration.userEmail }}</span>
                </div>
              </td>

              <td>
                <strong>{{ registration.eventTitle }}</strong>
              </td>

              <td>{{ formatDate(registration.eventDate) }}</td>

              <td>
                  <span :class="['status-pill', registration.paymentStatus]">
                    {{ paymentStatusText(registration.paymentStatus) }}
                  </span>
              </td>

              <td>
                  <span :class="['status-pill', registration.registrationStatus]">
                    {{ registrationStatusText(registration.registrationStatus) }}
                  </span>
              </td>

              <td>
                <button
                    v-if="registration.paymentProof"
                    class="proof-button"
                    @click="openPaymentProof(registration.paymentProof)"
                >
                  Bewijs openen
                </button>

                <span v-else class="muted-text">
                    Geen bewijs
                  </span>
              </td>

              <td>
                <div class="action-buttons">
                  <button
                      class="approve-button"
                      @click="approveRegistration(registration)"
                      :disabled="!registration.paymentProof"
                  >
                    Goedkeuren
                  </button>

                  <button
                      class="reject-button"
                      @click="markAsRejected(registration)"
                  >
                    Afwijzen
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>

          <div v-if="registrations.length === 0" class="empty-state">
            <h2>Geen registraties</h2>
            <p>Er zijn nog geen registraties binnengekomen.</p>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import StatusMessage from '../components/StatusMessage.vue'
import { fetchAdminRegistrations, updateRegistrationStatus } from '../services/api'
import { authState } from '../stores/auth'

const message = ref('')
const success = ref(false)
const registrations = ref([])

const isAdmin = computed(() => authState.user?.role === 'admin')

const pendingCount = computed(() => {
  return registrations.value.filter(registration => registration.paymentStatus === 'pending').length
})

const proofUploadedCount = computed(() => {
  return registrations.value.filter(registration => registration.paymentStatus === 'proof_uploaded').length
})

const confirmedCount = computed(() => {
  return registrations.value.filter(registration => registration.registrationStatus === 'confirmed').length
})

async function loadRegistrations() {
  registrations.value = await fetchAdminRegistrations()
}

onMounted(async () => {
  if (!isAdmin.value) {
    success.value = false
    message.value = 'Je hebt geen admin rechten.'
    return
  }

  try {
    await loadRegistrations()
  } catch (error) {
    success.value = false
    message.value = error.message
  }
})

function formatDate(date) {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function paymentStatusText(status) {
  if (status === 'pending') return 'Wacht op betaling'
  if (status === 'proof_uploaded') return 'Bewijs geüpload'
  if (status === 'paid') return 'Betaald'
  if (status === 'rejected') return 'Afgewezen'

  return status || '-'
}

function registrationStatusText(status) {
  if (status === 'pending') return 'In behandeling'
  if (status === 'confirmed') return 'Bevestigd'
  if (status === 'rejected') return 'Afgewezen'

  return status || '-'
}

function openPaymentProof(paymentProof) {
  const imageWindow = window.open('', '_blank')

  if (!imageWindow) {
    success.value = false
    message.value = 'Pop-up geblokkeerd. Sta pop-ups toe voor deze website.'
    return
  }

  imageWindow.document.write(`
    <html>
      <head>
        <title>Betaalbewijs</title>
        <style>
          body {
            margin: 0;
            padding: 24px;
            background: #0f172a;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }

          img {
            max-width: 95vw;
            max-height: 95vh;
            border-radius: 16px;
            background: white;
          }
        </style>
      </head>
      <body>
        <img src="${paymentProof}" alt="Betaalbewijs" />
      </body>
    </html>
  `)

  imageWindow.document.close()
}

async function approveRegistration(registration) {
  try {
    await updateRegistrationStatus(registration.id, {
      paymentStatus: 'paid',
      registrationStatus: 'confirmed'
    })

    registration.paymentStatus = 'paid'
    registration.registrationStatus = 'confirmed'

    success.value = true
    message.value = 'Registratie goedgekeurd. De gebruiker is nu officieel ingeschreven.'
  } catch (error) {
    success.value = false
    message.value = error.message
  }
}

async function markAsRejected(registration) {
  try {
    await updateRegistrationStatus(registration.id, {
      paymentStatus: 'rejected',
      registrationStatus: 'rejected'
    })

    registration.paymentStatus = 'rejected'
    registration.registrationStatus = 'rejected'

    success.value = true
    message.value = 'Registratie afgewezen.'
  } catch (error) {
    success.value = false
    message.value = error.message
  }
}
</script>

<style scoped>
.admin-registrations {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: 80px;
}

/* HERO */
.registrations-hero {
  position: relative;
  overflow: hidden;
  min-height: 390px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 40px;
  padding: 90px max(4vw, 32px) 66px;
  background:
      radial-gradient(circle at 86% 16%, rgba(37, 99, 235, 0.18), transparent 30%),
      linear-gradient(135deg, #ffffff 0%, #f8fafc 52%, #eef4ff 100%);
  border-bottom: 1px solid #e2e8f0;
}

.registrations-hero::after {
  content: "";
  position: absolute;
  right: -120px;
  bottom: -150px;
  width: 360px;
  height: 360px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
}

.registrations-hero > div {
  position: relative;
  z-index: 2;
}

.eyebrow {
  margin-bottom: 12px;
  color: #2563eb;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.registrations-hero h1 {
  max-width: 860px;
  margin-bottom: 18px;
  color: #0f172a;
  font-size: clamp(3rem, 6vw, 5.5rem);
  line-height: 0.92;
  letter-spacing: -0.08em;
}

.registrations-hero p {
  max-width: 680px;
  color: #64748b;
  font-size: 1.08rem;
  line-height: 1.8;
}

.hero-count {
  width: 155px;
  height: 155px;
  display: grid;
  place-items: center;
  text-align: center;
  border-radius: 36px;
  background: #0f172a;
  color: white;
  box-shadow: 0 24px 55px rgba(15, 23, 42, 0.22);
}

.hero-count strong {
  display: block;
  font-size: 3.2rem;
  line-height: 1;
}

.hero-count span {
  display: block;
  margin-top: 8px;
  color: #cbd5e1;
  font-size: 0.88rem;
  font-weight: 800;
}

/* CONTENT */
.registrations-content {
  width: min(1280px, 92%);
  margin: 46px auto 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 34px;
}

.summary-grid div {
  padding: 24px;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.07);
}

.summary-grid span {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.summary-grid strong {
  display: block;
  color: #0f172a;
  font-size: 2.2rem;
  line-height: 1;
  letter-spacing: -0.06em;
}

.summary-grid p {
  margin-top: 8px;
  color: #64748b;
}

/* PANEL */
.registrations-panel,
.access-card {
  padding: 30px;
  border-radius: 30px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.07);
}

.panel-heading {
  margin-bottom: 24px;
}

.panel-heading h2,
.access-card h2 {
  margin-bottom: 10px;
  color: #0f172a;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1;
  letter-spacing: -0.06em;
}

.panel-heading p,
.access-card p {
  color: #64748b;
}

/* TABLE */
.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 15px;
  color: #64748b;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

td {
  padding: 16px 15px;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
  vertical-align: middle;
}

td strong {
  color: #0f172a;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-cell span {
  color: #64748b;
  font-size: 0.88rem;
}

/* STATUS */
.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 900;
  background: #e2e8f0;
  color: #334155;
  white-space: nowrap;
}

.status-pill.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-pill.proof_uploaded {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-pill.paid,
.status-pill.confirmed {
  background: #dcfce7;
  color: #166534;
}

.status-pill.rejected {
  background: #fee2e2;
  color: #991b1b;
}

/* BUTTONS */
.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.proof-button,
.approve-button,
.reject-button {
  padding: 10px 13px;
  border-radius: 14px;
  font-size: 0.82rem;
  font-weight: 900;
  transition: 0.2s ease;
  white-space: nowrap;
}

.proof-button {
  background: #f1f5f9;
  color: #0f172a;
}

.proof-button:hover {
  background: #e2e8f0;
}

.approve-button {
  background: #2563eb;
  color: #ffffff;
}

.approve-button:hover {
  background: #1d4ed8;
}

.approve-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.reject-button {
  background: #fee2e2;
  color: #dc2626;
}

.reject-button:hover {
  background: #dc2626;
  color: #ffffff;
}

.muted-text {
  color: #94a3b8;
  font-weight: 800;
}

/* EMPTY / ACCESS */
.empty-state {
  padding: 54px 24px;
  text-align: center;
}

.empty-state h2 {
  margin-bottom: 10px;
  color: #0f172a;
  font-size: 2rem;
  letter-spacing: -0.05em;
}

.empty-state p {
  color: #64748b;
}

.access-card {
  width: min(1180px, 92%);
  margin: 46px auto 0;
}

/* RESPONSIVE */
@media (max-width: 1050px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 780px) {
  .registrations-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-count {
    width: 125px;
    height: 125px;
    border-radius: 30px;
  }
}

@media (max-width: 560px) {
  .registrations-hero {
    padding: 70px 24px 58px;
  }

  .registrations-hero h1 {
    font-size: 3rem;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .registrations-panel {
    padding: 22px;
    border-radius: 24px;
  }
}
</style>