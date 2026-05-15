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

      <!-- GOOGLE SHEETS -->
      <section class="google-panel">
        <div>
          <p class="eyebrow">Google Sheets</p>
          <h2>Automatische event-spreadsheets</h2>
          <p v-if="googleStatus.connected">
            Verbonden met {{ googleStatus.email || 'Google' }}. Nieuwe events, registraties, betalingen en statuswijzigingen worden automatisch gesynchroniseerd.
          </p>
          <p v-else>
            Verbind een Google-account om per event automatisch een online deelnemerslijst bij te houden.
          </p>
        </div>

        <button
            v-if="!googleStatus.connected"
            type="button"
            class="google-button"
            @click="connectGoogle"
            :disabled="googleLoading"
        >
          {{ googleLoading ? 'Bezig...' : 'Google verbinden' }}
        </button>

        <button
            v-else
            type="button"
            class="secondary-button"
            @click="syncAllSheets"
            :disabled="googleLoading"
        >
          {{ googleLoading ? 'Sheets bijwerken...' : 'Alles automatisch klaarzetten' }}
        </button>
      </section>

      <!-- EVENT EXPORTS -->
      <section class="event-export-panel">
        <div class="panel-heading export-heading">
          <div>
            <p class="eyebrow">Per event</p>
            <h2>Deelnemerslijst voor locatie</h2>
            <p>Bekijk of download de actuele lijst met goedgekeurde deelnemers per event.</p>
          </div>
          <label class="export-filter">
            <span>CSV filter</span>
            <select v-model="exportFilter">
              <option value="all">Alles</option>
              <option value="approved">Op locatie</option>
              <option value="pending_payment">Wacht op betaling</option>
              <option value="proof_uploaded">Bewijs geüpload</option>
              <option value="bus">Buslijst</option>
              <option value="shirts">Shirtmaten</option>
              <option value="cancelled">Geannuleerd</option>
            </select>
          </label>
        </div>

        <div v-if="eventSummaries.length > 0" class="event-export-grid">
          <article
              v-for="event in eventSummaries"
              :key="event.id"
              :class="['event-export-card', { active: selectedEventId === event.id }]"
          >
            <div>
              <span>{{ formatDate(event.date) }}</span>
              <h3>{{ event.title }}</h3>
              <p>{{ event.location || 'Locatie onbekend' }}</p>
            </div>

            <dl>
              <div>
                <dt>Goedgekeurd</dt>
                <dd>{{ event.approvedCount }}</dd>
              </div>
              <div>
                <dt>Totaal</dt>
                <dd>{{ event.totalCount }}</dd>
              </div>
            </dl>
            <p class="sync-meta">
              Laatste sync:
              <strong>{{ event.googleSheetLastSyncedAt ? formatDate(event.googleSheetLastSyncedAt) : 'nog niet' }}</strong>
              <span v-if="event.googleSheetLastError">- {{ event.googleSheetLastError }}</span>
            </p>

            <div class="event-export-actions">
              <button type="button" class="secondary-button" @click="selectEvent(event.id)">
                Bekijken
              </button>

              <button
                  type="button"
                  class="csv-button"
                  @click="exportCsvForEvent(event)"
                  :disabled="event.totalCount === 0"
              >
                Download CSV
              </button>

              <button
                  type="button"
                  class="google-sync-button"
                  @click="syncGoogleSheet(event)"
                  :disabled="!googleStatus.connected || googleLoading"
              >
                Herstel sync
              </button>

              <a
                  v-if="event.googleSheetUrl"
                  class="sheet-link"
                  :href="event.googleSheetUrl"
                  target="_blank"
              >
                Open Sheet
              </a>
            </div>
          </article>
        </div>

        <div v-if="selectedEventSummary" class="event-preview">
          <div class="preview-heading">
            <div>
              <h3>{{ selectedEventSummary.title }}</h3>
              <p>{{ selectedEventRegistrations.length }} registraties in deze export.</p>
            </div>

            <button
                type="button"
                class="csv-button"
                @click="exportCsvForEvent(selectedEventSummary)"
                :disabled="selectedEventRegistrations.length === 0"
            >
              Download actuele lijst
            </button>
          </div>

          <div class="table-wrapper compact">
            <table>
              <thead>
              <tr>
                <th>Naam</th>
                <th>E-mail</th>
                <th>Telefoon</th>
                <th>Shirtmaat</th>
                <th>Vervoer</th>
                <th>Kerk</th>
                <th>Status</th>
                <th>Op locatie</th>
              </tr>
              </thead>

              <tbody>
              <tr v-for="registration in selectedEventRegistrations" :key="registration.id">
                <td><strong>{{ registration.userName }}</strong></td>
                <td>{{ registration.userEmail }}</td>
                <td>{{ registration.userPhone || '-' }}</td>
                <td>{{ registration.shirtSize || '-' }}</td>
                <td>{{ transportOptionText(registration.transportOption) }}</td>
                <td>{{ registration.churchName || '-' }}</td>
                <td>{{ registrationStatusText(registration.registrationStatus) }}</td>
                <td>{{ isApprovedRegistration(registration) ? 'Ja' : 'Nee' }}</td>
              </tr>
              </tbody>
            </table>

            <div v-if="selectedEventRegistrations.length === 0" class="empty-state small">
              <h2>Nog geen goedgekeurde deelnemers</h2>
              <p>Nieuwe registraties verschijnen hier zodra mensen zich aanmelden.</p>
            </div>
          </div>
        </div>
      </section>

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
              <th>Extra</th>
              <th>Betaalstatus</th>
              <th>Registratie</th>
              <th>Admin notitie</th>
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
                <div class="extra-cell">
                  <span>{{ registration.shirtSize || 'Geen shirtmaat' }}</span>
                  <span>{{ transportOptionText(registration.transportOption) }}</span>
                </div>
              </td>

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
                <textarea
                    v-model="registration.adminNote"
                    class="note-input"
                    rows="2"
                    placeholder="Interne notitie"
                    @blur="saveRegistrationNote(registration)"
                />
              </td>

              <td>
                <button
                    v-if="registration.hasPaymentProof"
                    class="proof-button"
                    @click="openPaymentProof(registration)"
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
                      :disabled="!registration.hasPaymentProof"
                  >
                    Goedkeuren
                  </button>

                  <button
                      class="reject-button"
                      @click="markAsRejected(registration)"
                  >
                    Afwijzen
                  </button>

                  <button
                      class="csv-button"
                      @click="exportCsvForEvent(registration)"
                  >
                    Export CSV
                  </button>

                  <button
                      class="secondary-button"
                      @click="resendMail(registration)"
                      :disabled="!canResendRegistrationMail(registration)"
                  >
                    Mail opnieuw
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
import {
  fetchAdminRegistrations,
  fetchRegistrationPaymentProof,
  updateRegistrationStatus,
  exportApprovedUsersCsv,
  fetchGoogleSheetsStatus,
  fetchGoogleSheetsAuthUrl,
  syncGoogleSheetForEvent,
  syncAllGoogleSheets,
  resendRegistrationEmail
} from '../services/api'
import { authState } from '../stores/auth'

const message = ref('')
const success = ref(false)
const registrations = ref([])
const selectedEventId = ref('')
const exportFilter = ref('all')
const googleLoading = ref(false)
const googleStatus = ref({
  connected: false,
  email: null
})
const hasTriedAutoBackfill = ref(false)

const isAdmin = computed(() => authState.user?.role === 'admin')

const pendingCount = computed(() => {
  return registrations.value.filter(registration => registration.paymentStatus === 'pending').length
})

const proofUploadedCount = computed(() => {
  return registrations.value.filter(registration => registration.paymentStatus === 'proof_uploaded').length
})

const confirmedCount = computed(() => {
  return registrations.value.filter(isApprovedRegistration).length
})

const eventSummaries = computed(() => {
  const eventsById = new Map()

  registrations.value.forEach(registration => {
    if (!eventsById.has(registration.eventId)) {
      eventsById.set(registration.eventId, {
        id: registration.eventId,
        eventId: registration.eventId,
        title: registration.eventTitle,
        eventTitle: registration.eventTitle,
        date: registration.eventDate,
        location: registration.eventLocation,
        googleSheetUrl: registration.googleSheetUrl,
        googleSheetLastSyncedAt: registration.googleSheetLastSyncedAt,
        googleSheetLastError: registration.googleSheetLastError,
        totalCount: 0,
        approvedCount: 0
      })
    }

    const event = eventsById.get(registration.eventId)
    event.totalCount += 1

    if (isApprovedRegistration(registration)) {
      event.approvedCount += 1
    }
  })

  return Array.from(eventsById.values()).sort((a, b) => {
    return new Date(a.date || 0) - new Date(b.date || 0)
  })
})

const selectedEventSummary = computed(() => {
  return eventSummaries.value.find(event => event.id === selectedEventId.value) || null
})

const selectedEventRegistrations = computed(() => {
  if (!selectedEventId.value) return []

  return registrations.value
      .filter(registration => registration.eventId === selectedEventId.value)
      .sort((a, b) => (a.userName || '').localeCompare(b.userName || '', 'nl'))
})

async function loadRegistrations() {
  registrations.value = await fetchAdminRegistrations()

  if (!selectedEventId.value && eventSummaries.value.length > 0) {
    selectedEventId.value = eventSummaries.value[0].id
  }
}

async function refreshGoogleStatus() {
  try {
    googleStatus.value = await fetchGoogleSheetsStatus()

    if (googleStatus.value.connected && !hasTriedAutoBackfill.value) {
      hasTriedAutoBackfill.value = true
      await syncAllSheets({ quiet: true })
    }
  } catch (error) {
    success.value = false
    message.value = error.message
  }
}

onMounted(async () => {
  if (!isAdmin.value) {
    success.value = false
    message.value = 'Je hebt geen admin rechten.'
    return
  }

  try {
    await refreshGoogleStatus()
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

async function connectGoogle() {
  googleLoading.value = true
  message.value = ''

  try {
    const authUrl = await fetchGoogleSheetsAuthUrl()
    window.open(authUrl, '_blank')

    success.value = true
    message.value = 'Google verbindingspagina geopend. Rond de toestemming af; daarna zetten we de sheets automatisch klaar.'
  } catch (error) {
    success.value = false
    message.value = error.message
  } finally {
    googleLoading.value = false
  }
}

async function syncAllSheets(options = {}) {
  googleLoading.value = true

  if (!options.quiet) {
    message.value = ''
  }

  try {
    const result = await syncAllGoogleSheets()
    await loadRegistrations()
    googleStatus.value = await fetchGoogleSheetsStatus()

    success.value = result.failedCount === 0
    message.value = result.failedCount === 0
        ? `${result.syncedCount} event-sheets automatisch bijgewerkt.`
        : `${result.syncedCount} sheets bijgewerkt, ${result.failedCount} mislukt. Bekijk de foutmelding per event.`
  } catch (error) {
    if (!options.quiet) {
      success.value = false
      message.value = error.message
    }
  } finally {
    googleLoading.value = false
  }
}

async function syncGoogleSheet(event) {
  googleLoading.value = true
  message.value = ''

  try {
    const result = await syncGoogleSheetForEvent(event.eventId)

    success.value = true
    message.value = `Google Sheet bijgewerkt met ${result.rowCount} registraties.`

    await loadRegistrations()
  } catch (error) {
    success.value = false
    message.value = error.message
  } finally {
    googleLoading.value = false
  }
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
  if (status === 'approved') return 'Goedgekeurd'
  if (status === 'goedgekeurd') return 'Goedgekeurd'
  if (status === 'rejected') return 'Afgewezen'

  return status || '-'
}

function transportOptionText(option) {
  if (option === 'own_transport') return 'Eigen vervoer'
  if (option === 'bus') return 'Bus'

  return '-'
}

function isApprovedRegistration(registration) {
  return registration.paymentStatus === 'paid'
      && ['confirmed', 'approved', 'goedgekeurd'].includes(registration.registrationStatus)
}

function canResendRegistrationMail(registration) {
  return !!registration.userEmail
}

function selectEvent(eventId) {
  selectedEventId.value = eventId
}

async function openPaymentProof(registration) {
  const imageWindow = window.open('', '_blank')

  if (!imageWindow) {
    success.value = false
    message.value = 'Pop-up geblokkeerd. Sta pop-ups toe voor deze website.'
    return
  }

  imageWindow.document.write('<p style="font-family: Arial, sans-serif; padding: 24px;">Betaalbewijs laden...</p>')

  try {
    const proof = await fetchRegistrationPaymentProof(registration.id)

    imageWindow.document.open()
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
          <img src="${proof.paymentProof}" alt="Betaalbewijs" />
        </body>
      </html>
    `)
    imageWindow.document.close()
  } catch (error) {
    imageWindow.close()
    success.value = false
    message.value = error.message
  }
}

async function approveRegistration(registration) {
  try {
    await updateRegistrationStatus(registration.id, {
      paymentStatus: 'paid',
      registrationStatus: 'confirmed',
      adminNote: registration.adminNote || null
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
      registrationStatus: 'rejected',
      adminNote: registration.adminNote || null
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

async function saveRegistrationNote(registration) {
  try {
    await updateRegistrationStatus(registration.id, {
      paymentStatus: registration.paymentStatus,
      registrationStatus: registration.registrationStatus,
      adminNote: registration.adminNote || null
    })

    success.value = true
    message.value = 'Admin notitie opgeslagen.'
  } catch (error) {
    success.value = false
    message.value = error.message
  }
}

async function resendMail(registration) {
  try {
    await resendRegistrationEmail(registration.id)

    success.value = true
    message.value = 'Statusmail wordt verstuurd.'
  } catch (error) {
    success.value = false
    message.value = error.message
  }
}

async function exportCsvForEvent(registration) {
  try {
    await exportApprovedUsersCsv(registration.eventId, registration.eventTitle, exportFilter.value)

    success.value = true
    message.value = 'Actuele deelnemerslijst is gedownload.'
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

.csv-button {
  padding: 10px 13px;
  border-radius: 14px;
  background: #dcfce7;
  color: #166534;
  font-size: 0.82rem;
  font-weight: 900;
  transition: 0.2s ease;
  white-space: nowrap;
}

.csv-button:hover {
  background: #16a34a;
  color: #ffffff;
}

.csv-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
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
.event-export-panel,
.google-panel,
.access-card {
  padding: 30px;
  border-radius: 30px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.07);
}

.event-export-panel {
  margin-bottom: 34px;
}

.google-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 34px;
}

.google-panel h2 {
  margin-bottom: 10px;
  color: #0f172a;
  font-size: clamp(1.75rem, 3vw, 2.7rem);
  line-height: 1;
}

.google-panel p {
  max-width: 760px;
  color: #64748b;
  line-height: 1.7;
}

.google-button,
.google-sync-button,
.sheet-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 13px;
  border-radius: 14px;
  font-size: 0.82rem;
  font-weight: 900;
  text-decoration: none;
  white-space: nowrap;
}

.google-button {
  background: #2563eb;
  color: #ffffff;
}

.google-button:hover {
  background: #1d4ed8;
}

.google-sync-button {
  background: #eef2ff;
  color: #3730a3;
}

.google-sync-button:hover {
  background: #3730a3;
  color: #ffffff;
}

.google-button:disabled,
.google-sync-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.sheet-link {
  background: #f1f5f9;
  color: #0f172a;
}

.sheet-link:hover {
  background: #e2e8f0;
}

.panel-heading {
  margin-bottom: 24px;
}

.export-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
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

.event-export-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.event-export-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #f8fafc;
}

.event-export-card.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.event-export-card span {
  display: block;
  margin-bottom: 8px;
  color: #2563eb;
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.event-export-card h3 {
  margin-bottom: 6px;
  color: #0f172a;
  font-size: 1.12rem;
}

.event-export-card p {
  color: #64748b;
}

.event-export-card dl {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 0;
}

.event-export-card dl div {
  padding: 12px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.event-export-card dt {
  margin-bottom: 4px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.event-export-card dd {
  margin: 0;
  color: #0f172a;
  font-size: 1.45rem;
  font-weight: 900;
}

.event-export-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.secondary-button {
  padding: 10px 13px;
  border-radius: 14px;
  background: #e2e8f0;
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 900;
  white-space: nowrap;
}

.secondary-button:hover {
  background: #cbd5e1;
}

.event-preview {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.preview-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 14px;
}

.preview-heading h3 {
  margin-bottom: 5px;
  color: #0f172a;
  font-size: 1.35rem;
}

.preview-heading p {
  color: #64748b;
}

/* TABLE */
.table-wrapper {
  overflow-x: auto;
}

.table-wrapper.compact {
  border: 1px solid #e2e8f0;
  border-radius: 18px;
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

.user-cell span,
.extra-cell span {
  color: #64748b;
  font-size: 0.88rem;
}

.extra-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
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
.status-pill.confirmed,
.status-pill.approved,
.status-pill.goedgekeurd {
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

.empty-state.small {
  padding: 34px 18px;
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

  .google-panel {
    align-items: flex-start;
    flex-direction: column;
    padding: 22px;
    border-radius: 24px;
  }

  .preview-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
