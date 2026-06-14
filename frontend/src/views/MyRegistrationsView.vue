<template>
  <main class="registrations-view">
    <!-- HERO -->
    <section class="registrations-hero">
      <div class="registrations-hero__content">
        <p class="eyebrow">Mijn registraties</p>

        <h1>Je aangemelde events</h1>

        <p>
          Bekijk hier alle evenementen waarvoor je bent ingeschreven en controleer
          je registratie- en betaalstatus.
        </p>

        <RouterLink to="/events" class="hero-button">
          Nieuwe events bekijken
        </RouterLink>
      </div>

      <div class="registration-count">
        <strong>{{ registrations.length }}</strong>
        <span>registraties</span>
      </div>
    </section>

    <StatusMessage :message="message" :success="success" />

    <!-- CONTENT -->
    <section v-if="loading" class="state-box">
      Registraties worden geladen...
    </section>

    <section v-else-if="registrations.length" class="registrations-list">
      <article
          v-for="registration in registrations"
          :key="registration.id"
          class="registration-card"
      >
        <div class="registration-image">
          <img
              :src="registration.eventImage"
              :alt="registration.eventTitle"
          />
        </div>

        <div class="registration-content">
          <div class="registration-top">
            <span class="category-badge">
              {{ registration.category }}
            </span>

            <span class="status-badge">
              {{ registration.registrationStatus }}
            </span>
          </div>

          <h2>{{ registration.eventTitle }}</h2>

          <div class="registration-details">
            <div>
              <span>Datum</span>
              <strong>{{ formatDateRange(registration.eventDate, registration.eventDateEnd) }}</strong>
            </div>

            <div>
              <span>Locatie</span>
              <strong>{{ registration.eventLocation }}</strong>
            </div>

            <div>
              <span>Prijs</span>
              <strong>€{{ Number(registration.selectedPrice ?? registration.price).toFixed(2) }}</strong>
            </div>

            <div>
              <span>Dagen</span>
              <strong>{{ formatSelectedDays(registration.selectedDays) }}</strong>
            </div>

            <div>
              <span>Overnachting</span>
              <strong>{{ formatSelectedNights(registration.selectedNights) }}</strong>
            </div>

            <div>
              <span>Vervoer</span>
              <strong>{{ transportOptionText(registration.transportOption) }}</strong>
            </div>

            <div>
              <span>Betaalstatus</span>
              <strong>{{ registration.paymentStatus }}</strong>
            </div>

            <div v-if="registration.registrationDeadline">
              <span>Deadline</span>
              <strong>{{ formatDate(registration.registrationDeadline) }}</strong>
            </div>
          </div>

          <div class="timeline">
            <span :class="{ done: true }">Aangemeld</span>
            <span :class="{ done: registration.paymentStatus !== 'pending' }">Betaalbewijs</span>
            <span :class="{ done: registration.registrationStatus === 'confirmed' }">Bevestigd</span>
          </div>

          <button
              v-if="!registration.cancelledAt && registration.registrationStatus !== 'confirmed'"
              class="cancel-registration-button"
              type="button"
              @click="cancelMyRegistration(registration)"
          >
            Inschrijving annuleren
          </button>
        </div>
      </article>
    </section>

    <section v-else class="empty-panel">
      <div class="empty-icon">✦</div>

      <h2>Geen registraties gevonden</h2>

      <p>
        Je bent momenteel nog niet ingeschreven voor een event.
      </p>

      <RouterLink to="/events" class="empty-button">
        Bekijk events
      </RouterLink>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import StatusMessage from '../components/StatusMessage.vue'
import { cancelRegistration, fetchMyRegistrations } from '../services/api'

const loading = ref(false)
const message = ref('')
const success = ref(false)
const registrations = ref([])

function formatDate(date) {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function formatDateRange(startValue, endValue) {
  if (!startValue) return '-'
  const start = formatDate(startValue)

  if (!endValue || String(startValue).slice(0, 10) === String(endValue).slice(0, 10)) {
    return start
  }

  return `${start} t/m ${formatDate(endValue)}`
}

function formatSelectedDays(value) {
  if (!value) return 'Volledig event'

  return String(value)
      .split(',')
      .map(day => `Dag ${day.trim()}`)
      .join(', ')
}

function parseSelection(value) {
  if (!value) return []

  return String(value)
      .split(',')
      .map(item => Number(item.trim()))
      .filter(Number.isInteger)
}

function formatSelectedNights(value) {
  const nights = parseSelection(value)

  if (nights.length === 0) return 'Geen overnachting'

  return nights
      .map(night => {
        if (night === 1) return 'Vrijdag op zaterdag'
        if (night === 2) return 'Zaterdag op zondag'
        return `Nacht ${night}`
      })
      .join(', ')
}

function transportOptionText(option) {
  if (option === 'own_transport') return 'Eigen vervoer'
  if (option === 'bus') return 'Bus tegen aanvullende kosten'

  return '-'
}

onMounted(async () => {
  loading.value = true

  try {
    registrations.value = await fetchMyRegistrations()
    success.value = true
  } catch (error) {
    success.value = false
    message.value = error.message
  } finally {
    loading.value = false
  }
})

async function cancelMyRegistration(registration) {
  try {
    await cancelRegistration(registration.id)
    registration.registrationStatus = 'cancelled'
    registration.cancelledAt = new Date().toISOString()

    success.value = true
    message.value = 'Je inschrijving is geannuleerd.'
  } catch (error) {
    success.value = false
    message.value = error.message
  }
}
</script>

<style scoped>
.registrations-view {
  min-height: 100vh;
  background: #f7f4ee;
  padding-bottom: 80px;
}

/* HERO */
.registrations-hero {
  position: relative;
  overflow: hidden;
  min-height: 420px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 40px;
  padding: 90px max(4vw, 32px) 70px;
  background:
      linear-gradient(90deg, rgba(9, 17, 34, 0.9), rgba(9, 17, 34, 0.58)),
      url('../assets/home.png') center / cover;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.registrations-hero__content {
  position: relative;
  z-index: 2;
  max-width: 780px;
}

.eyebrow {
  margin-bottom: 14px;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.registrations-hero h1 {
  margin-bottom: 18px;
  color: #ffffff;
  font-size: clamp(3rem, 6vw, 5.8rem);
  line-height: 0.92;
  letter-spacing: -0.08em;
}

.registrations-hero p {
  max-width: 640px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 1.08rem;
  line-height: 1.8;
}

.hero-button {
  display: inline-flex;
  margin-top: 28px;
  padding: 14px 20px;
  min-height: 50px;
  border-radius: 10px;
  background: #2563eb;
  color: #ffffff;
  font-weight: 900;
  text-decoration: none;
  transition: 0.2s ease;
}

.hero-button:hover {
  background: #1d4ed8;
  transform: translateY(-2px);
}

.registration-count {
  position: relative;
  z-index: 2;
  width: 150px;
  height: 150px;
  display: grid;
  place-items: center;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.68);
  color: #ffffff;
  box-shadow: 0 24px 55px rgba(15, 23, 42, 0.22);
}

.registration-count strong {
  display: block;
  font-size: 3.2rem;
  line-height: 1;
  letter-spacing: -0.08em;
}

.registration-count span {
  display: block;
  margin-top: 8px;
  color: #cbd5e1;
  font-size: 0.9rem;
  font-weight: 800;
}

/* LIST */
.registrations-list {
  width: min(1280px, calc(100% - 56px));
  margin: 46px auto 0;
  display: grid;
  gap: 22px;
}

.registration-card {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  overflow: hidden;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.07);
  transition: 0.22s ease;
}

.registration-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 26px 60px rgba(15, 23, 42, 0.11);
}

.registration-image {
  min-height: 260px;
  background: #e2e8f0;
  overflow: hidden;
}

.registration-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.registration-content {
  padding: 28px;
}

.registration-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.category-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 900;
}

.category-badge {
  background: #dbeafe;
  color: #2563eb;
}

.status-badge {
  background: #f1f5f9;
  color: #475569;
}

.registration-card h2 {
  margin-bottom: 24px;
  color: #0f172a;
  font-size: clamp(1.7rem, 3vw, 2.5rem);
  line-height: 1;
  letter-spacing: -0.06em;
}

.registration-details {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.registration-details div {
  padding: 18px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.registration-details span {
  display: block;
  margin-bottom: 7px;
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.registration-details strong {
  color: #0f172a;
  word-break: break-word;
}

.timeline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.timeline span {
  padding: 8px 10px;
  border-radius: 8px;
  background: #e2e8f0;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 900;
}

.timeline span.done {
  background: #dcfce7;
  color: #166534;
}

.cancel-registration-button {
  margin-top: 16px;
  min-height: 46px;
  padding: 11px 14px;
  border-radius: 8px;
  background: #fee2e2;
  color: #991b1b;
  font-weight: 900;
}

/* STATES */
.state-box,
.empty-panel {
  width: min(1280px, calc(100% - 56px));
  margin: 46px auto 0;
  padding: 64px 32px;
  text-align: center;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.07);
}

.state-box {
  color: #64748b;
  font-weight: 900;
}

.empty-icon {
  margin-bottom: 16px;
  color: #2563eb;
  font-size: 2.2rem;
}

.empty-panel h2 {
  margin-bottom: 10px;
  color: #0f172a;
  font-size: 2.2rem;
  letter-spacing: -0.05em;
}

.empty-panel p {
  margin-bottom: 24px;
  color: #64748b;
}

.empty-button {
  display: inline-flex;
  justify-content: center;
  padding: 14px 22px;
  min-height: 50px;
  border-radius: 10px;
  background: #2563eb;
  color: #ffffff;
  font-weight: 900;
  text-decoration: none;
}

/* RESPONSIVE */
@media (max-width: 1050px) {
  .registration-card {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .registration-details {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 780px) {
  .registrations-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .registration-count {
    width: 100%;
    height: auto;
    min-height: 88px;
    display: flex;
    justify-content: space-between;
    padding: 18px;
    border-radius: 14px;
  }

  .registration-card {
    grid-template-columns: 1fr;
  }

  .registration-image {
    height: 220px;
    min-height: unset;
  }
}

@media (max-width: 560px) {
  .registrations-hero {
    padding: 70px 24px 58px;
  }

  .registrations-hero h1 {
    font-size: 2.55rem;
    letter-spacing: -0.05em;
  }

  .hero-button,
  .empty-button {
    width: 100%;
  }

  .registration-content {
    padding: 18px;
  }

  .registration-details {
    grid-template-columns: 1fr;
  }

  .registrations-list,
  .state-box,
  .empty-panel {
    width: calc(100% - 28px);
  }
}
</style>
