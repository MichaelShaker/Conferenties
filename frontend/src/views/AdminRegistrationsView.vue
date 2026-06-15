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
            <p class="eyebrow">Goedgekeurde deelnemers</p>
            <h2>Deelnemerslijsten alleen openen wanneer nodig.</h2>
            <p>De controlelijst blijft rustig. Open dit blok alleen als je locatie- of exportlijsten nodig hebt.</p>
          </div>

          <button type="button" class="secondary-button" @click="showApprovedLists = !showApprovedLists">
            {{ showApprovedLists ? 'Lijsten verbergen' : 'Goedgekeurde deelnemers tonen' }}
          </button>
        </div>

        <div v-if="showApprovedLists && eventSummaries.length > 0" class="event-export-grid">
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
            </dl>
            <p class="sync-meta">
              Laatste sync:
              <strong>{{ event.googleSheetLastSyncedAt ? formatDate(event.googleSheetLastSyncedAt) : 'nog niet' }}</strong>
              <span v-if="event.googleSheetLastError">- {{ event.googleSheetLastError }}</span>
            </p>

            <div class="event-export-actions">
              <button type="button" class="secondary-button" @click="selectEvent(event.id)">
                Lijst bekijken
              </button>

              <button
                  type="button"
                  class="csv-button"
                  @click="exportCsvForEvent(event)"
                  :disabled="event.approvedCount === 0"
              >
                Download CSV
              </button>

              <button
                  type="button"
                  class="google-sync-button"
                  @click="syncGoogleSheet(event)"
                  :disabled="!googleStatus.connected || googleLoading"
              >
                Sheet maken/bijwerken
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

        <div v-if="showApprovedLists && selectedEventSummary" class="event-preview">
          <div class="preview-heading">
            <div>
              <h3>{{ selectedEventSummary.title }}</h3>
              <p>{{ selectedEventRegistrations.length }} goedgekeurde registraties in deze export.</p>
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
                <th>Geslacht</th>
                <th>Shirtmaat</th>
                <th>Vervoer</th>
                <th>Dagen</th>
                <th>Nachten</th>
                <th>Type verblijf</th>
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
                <td>{{ genderText(registration.userGender || registration.gender) }}</td>
                <td>{{ registration.shirtSize || '-' }}</td>
                <td>{{ transportOptionText(registration.transportOption) }}</td>
                <td>{{ formatSelectedDays(registration) }}</td>
                <td>{{ formatSelectedNights(registration) }}</td>
                <td>{{ attendanceTypeText(registration) }}</td>
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
            <h2>{{ activeTabLabel }}</h2>
            <p>Werk vanuit de wachtrij en houd goedgekeurde deelnemers apart.</p>
          </div>
        </div>

        <div class="registration-tabs" role="tablist" aria-label="Registratie filters">
          <button
              v-for="tab in registrationTabs"
              :key="tab.id"
              type="button"
              :class="['tab-button', { active: activeRegistrationTab === tab.id }]"
              @click="activeRegistrationTab = tab.id"
          >
            <span>{{ tab.label }}</span>
            <strong>{{ tab.count }}</strong>
          </button>
        </div>

        <div class="registration-filterbar">
          <label class="search-field">
            <span>Zoeken</span>
            <input
                v-model.trim="registrationFilters.search"
                type="search"
                placeholder="Naam, e-mail of telefoon"
            />
          </label>

          <label>
            <span>Event</span>
            <select v-model="registrationFilters.eventId">
              <option value="">Alle events</option>
              <option v-for="event in eventSummaries" :key="event.id" :value="String(event.id)">
                {{ event.title }}
              </option>
            </select>
          </label>

          <label>
            <span>Vervoer</span>
            <select v-model="registrationFilters.transport">
              <option value="">Alle vervoer</option>
              <option value="own_transport">Eigen vervoer</option>
              <option value="bus">Bus</option>
              <option value="missing">Niet ingevuld</option>
            </select>
          </label>

          <label>
            <span>Geslacht</span>
            <select v-model="registrationFilters.gender">
              <option value="">Alle geslachten</option>
              <option value="male">Man</option>
              <option value="female">Vrouw</option>
              <option value="other">Anders / liever niet zeggen</option>
              <option value="missing">Niet ingevuld</option>
            </select>
          </label>

          <label>
            <span>Dagen</span>
            <select v-model="registrationFilters.dayCount">
              <option value="">Alle dagen</option>
              <option value="1">1 dag</option>
              <option value="2">2 dagen</option>
              <option value="3">3 dagen</option>
              <option value="full">Volledig event</option>
            </select>
          </label>

          <label>
            <span>Nachten</span>
            <select v-model="registrationFilters.nightFilter">
              <option value="">Alle nachten</option>
              <option value="none">Geen overnachting</option>
              <option value="1_night">1 nacht</option>
              <option value="2_nights">2 nachten</option>
              <option value="night_1">Vrijdag op zaterdag</option>
              <option value="night_2">Zaterdag op zondag</option>
            </select>
          </label>

          <button
              type="button"
              class="clear-filters-button"
              :disabled="!hasActiveRegistrationFilters"
              @click="clearRegistrationFilters"
          >
            Wissen
          </button>
        </div>

        <p class="filter-result-count">
          {{ filteredRegistrations.length }} van {{ tabFilteredRegistrations.length }} registraties zichtbaar
        </p>

        <div class="table-wrapper">
          <table>
            <thead>
            <tr>
              <th>Gebruiker</th>
              <th>Betaald</th>
              <th>Verblijf</th>
              <th>Prijs</th>
              <th>Actie</th>
            </tr>
            </thead>

            <tbody>
            <template v-for="registration in filteredRegistrations" :key="registration.id">
              <tr
                  :class="{ selected: selectedRegistration?.id === registration.id }"
                  @click="selectRegistration(registration)"
              >
                <td data-label="Gebruiker">
                  <div class="user-cell">
                    <strong>{{ registration.userName }}</strong>
                    <span>{{ registration.eventTitle }}</span>
                    <span v-if="registration.userPhone" class="user-phone">
                      {{ registration.userPhone }}
                    </span>
                    <span class="user-meta">
                      {{ genderText(registration.userGender) }}
                    </span>
                  </div>
                </td>

                <td data-label="Betaald">
                  <div class="payment-cell">
                    <span :class="['status-pill', registration.paymentStatus]">
                      {{ paymentStatusText(registration.paymentStatus) }}
                    </span>
                    <span class="payment-method-pill">
                      {{ paymentMethodText(registration.paymentMethod) }}
                    </span>
                  </div>
                </td>

                <td data-label="Verblijf">
                  <div class="attendance-cell">
                    <strong>{{ attendanceTypeText(registration) }}</strong>
                    <div v-if="attendanceTagList(registration).length" class="attendance-tags">
                      <span>{{ formatSelectedDays(registration) }}</span>
                      <span :class="{ muted: !hasOvernightStay(registration) }">
                        {{ formatSelectedNights(registration) }}
                      </span>
                    </div>
                  </div>
                </td>
                <td data-label="Prijs">€{{ Number(registration.selectedPrice || 0).toFixed(2) }}</td>

                <td data-label="Actie">
                  <div class="action-buttons">
                    <button
                        class="details-button"
                        @click.stop="selectRegistration(registration)"
                    >
                      {{ selectedRegistration?.id === registration.id ? 'Sluiten' : 'Openen' }}
                    </button>

                    <button
                        v-if="registration.hasPaymentProof"
                        class="proof-button"
                        @click.stop="openPaymentProof(registration)"
                    >
                      Bewijs
                    </button>

                    <button
                        v-if="isPendingRegistration(registration)"
                        class="approve-button"
                        @click.stop="approveRegistration(registration)"
                    >
                      Goedkeuren
                    </button>

                    <button
                        v-if="isPendingRegistration(registration)"
                        class="reject-button"
                        @click.stop="markAsRejected(registration)"
                    >
                      Afwijzen
                    </button>

                    <button
                        v-if="isRejectedRegistration(registration)"
                        class="restore-button"
                        @click.stop="restoreRegistrationToPending(registration)"
                    >
                      Terugzetten
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="selectedRegistration?.id === registration.id" class="detail-row">
                <td colspan="5">
                  <section class="registration-detail-panel">
                    <div class="detail-panel-heading">
                      <div>
                        <p class="eyebrow">Details</p>
                        <h3>{{ registration.userName }}</h3>
                        <p>{{ registration.eventTitle }}</p>
                      </div>

                      <button type="button" class="icon-button" @click.stop="selectedRegistration = null" aria-label="Details sluiten">
                        x
                      </button>
                    </div>

                    <div class="detail-grid">
                      <div>
                        <span>E-mail</span>
                        <strong>{{ registration.userEmail || '-' }}</strong>
                      </div>

                      <div>
                        <span>Telefoon</span>
                        <strong>{{ registration.userPhone || '-' }}</strong>
                      </div>

                      <div>
                        <span>Geslacht</span>
                        <strong>{{ genderText(registration.userGender) }}</strong>
                      </div>

                      <div>
                        <span>Datum</span>
                        <strong>{{ formatDate(registration.eventDate) }}</strong>
                      </div>

                      <div>
                        <span>Dagen</span>
                        <strong>{{ formatSelectedDays(registration) }}</strong>
                      </div>

                      <div>
                        <span>Nachten</span>
                        <strong>{{ formatSelectedNights(registration) }}</strong>
                      </div>

                      <div>
                        <span>Aanwezigheid</span>
                        <strong>{{ attendanceTypeText(registration) }}</strong>
                      </div>

                      <div>
                        <span>Prijs</span>
                        <strong>€{{ Number(registration.selectedPrice || 0).toFixed(2) }}</strong>
                      </div>

                      <div>
                        <span>Betaalwijze</span>
                        <strong>{{ paymentMethodText(registration.paymentMethod) }}</strong>
                      </div>

                      <div>
                        <span>Shirtmaat</span>
                        <strong>{{ registration.shirtSize || '-' }}</strong>
                      </div>

                      <div>
                        <span>Vervoer</span>
                        <strong>{{ transportOptionText(registration.transportOption) }}</strong>
                      </div>

                      <div>
                        <span>Kerk</span>
                        <strong>{{ registration.churchName || '-' }}</strong>
                      </div>

                      <div>
                        <span>Status</span>
                        <strong>{{ registrationStatusText(registration.registrationStatus) }}</strong>
                      </div>
                    </div>

                    <label class="admin-note-field" @click.stop>
                      <span>Admin notitie</span>
                      <textarea
                          v-model="registration.adminNote"
                          rows="3"
                          placeholder="Bijv. betaling besproken, bijzonderheid, later opvolgen..."
                      />
                    </label>

                    <div class="detail-actions">
                      <button
                          v-if="registration.hasPaymentProof"
                          class="proof-button"
                          @click.stop="openPaymentProof(registration)"
                      >
                        Betaalbewijs openen
                      </button>

                      <button class="secondary-button" @click.stop="saveRegistrationNote(registration)">
                        Notitie opslaan
                      </button>

                      <button
                          v-if="isPendingRegistration(registration)"
                          class="approve-button"
                          @click.stop="approveRegistration(registration)"
                      >
                        Goedkeuren
                      </button>

                      <button
                          v-if="isPendingRegistration(registration)"
                          class="reject-button"
                          @click.stop="markAsRejected(registration)"
                      >
                        Afwijzen
                      </button>

                      <button
                          v-if="isRejectedRegistration(registration)"
                          class="restore-button"
                          @click.stop="restoreRegistrationToPending(registration)"
                      >
                        Terugzetten naar openstaand
                      </button>
                    </div>
                  </section>
                </td>
              </tr>
            </template>
            </tbody>
          </table>

          <div v-if="filteredRegistrations.length === 0" class="empty-state">
            <h2>Geen registraties</h2>
            <p>Er zijn geen registraties in deze tab.</p>
          </div>
        </div>

      </section>

      <section class="audit-panel">
        <div class="panel-heading audit-heading">
          <div>
            <p class="eyebrow">Audit log</p>
            <h2>Laatste controles</h2>
            <p>Zie snel wie recent is goedgekeurd, afgewezen of aangepast.</p>
          </div>

          <RouterLink class="secondary-button" to="/admin/audit">
            Volledige log openen
          </RouterLink>
        </div>

        <div v-if="recentRegistrationAuditLogs.length" class="audit-list">
          <article v-for="log in recentRegistrationAuditLogs" :key="log.id" class="audit-item">
            <div>
              <strong>{{ auditActionText(log) }}</strong>
              <span>{{ auditSubjectText(log) }}</span>
            </div>
            <p>{{ log.actorName || log.actorEmail || 'Onbekende admin' }} · {{ formatDateTime(log.createdAt) }}</p>
          </article>
        </div>

        <p v-else class="muted-text">Nog geen recente registratie-acties.</p>
      </section>
    </section>

    <div v-if="emailModalRegistration" class="modal-backdrop" @click.self="closeCustomEmailModal">
      <section class="email-modal" role="dialog" aria-modal="true" aria-labelledby="custom-email-title">
        <div class="modal-heading">
          <div>
            <p class="eyebrow">Persoonlijke mail</p>
            <h2 id="custom-email-title">{{ emailModalRegistration.userName }}</h2>
            <p>{{ emailModalRegistration.userEmail }} - {{ emailModalRegistration.eventTitle }}</p>
          </div>
          <button type="button" class="icon-button" @click="closeCustomEmailModal" aria-label="Sluiten">x</button>
        </div>

        <label class="modal-field">
          <span>Onderwerp</span>
          <input v-model="customEmail.subject" type="text" maxlength="160" />
        </label>

        <label class="modal-field">
          <span>Bericht</span>
          <textarea v-model="customEmail.body" rows="8" placeholder="Schrijf hier wat je nog nodig hebt..." />
        </label>

        <div class="modal-actions">
          <button type="button" class="secondary-button" @click="closeCustomEmailModal">
            Annuleren
          </button>
          <button
              type="button"
              class="approve-button"
              @click="sendCustomEmail"
              :disabled="emailSending || !customEmail.subject.trim() || !customEmail.body.trim()"
          >
            {{ emailSending ? 'Versturen...' : 'Mail versturen' }}
          </button>
        </div>
      </section>
    </div>
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
  resendRegistrationEmail,
  sendCustomRegistrationEmail,
  fetchAdminAuditLogs
} from '../services/api'
import { authState } from '../stores/auth'

const message = ref('')
const success = ref(false)
const registrations = ref([])
const auditLogs = ref([])
const selectedEventId = ref('')
const selectedRegistration = ref(null)
const activeRegistrationTab = ref('pending')
const showApprovedLists = ref(false)
const registrationFilters = ref({
  search: '',
  eventId: '',
  transport: '',
  gender: '',
  dayCount: '',
  nightFilter: ''
})
const googleLoading = ref(false)
const googleStatus = ref({
  connected: false,
  email: null
})
const emailModalRegistration = ref(null)
const emailSending = ref(false)
const customEmail = ref({
  subject: '',
  body: ''
})

const isAdmin = computed(() => authState.user?.role === 'admin')

const recentRegistrationAuditLogs = computed(() => {
  return auditLogs.value
      .filter(log => log.entityType === 'registration' || String(log.action || '').startsWith('registration.'))
      .slice(0, 6)
})

const pendingCount = computed(() => {
  return registrations.value.filter(registration => registration.paymentStatus === 'pending').length
})

const proofUploadedCount = computed(() => {
  return registrations.value.filter(registration => registration.paymentStatus === 'proof_uploaded').length
})

const confirmedCount = computed(() => {
  return registrations.value.filter(isApprovedRegistration).length
})

const rejectedCount = computed(() => {
  return registrations.value.filter(isRejectedRegistration).length
})

const pendingReviewCount = computed(() => {
  return registrations.value.filter(isPendingRegistration).length
})

const registrationTabs = computed(() => [
  {
    id: 'pending',
    label: 'Openstaand',
    count: pendingReviewCount.value
  },
  {
    id: 'approved',
    label: 'Goedgekeurd',
    count: confirmedCount.value
  },
  {
    id: 'rejected',
    label: 'Afgekeurd',
    count: rejectedCount.value
  },
  {
    id: 'all',
    label: 'Alles',
    count: registrations.value.length
  }
])

const activeTabLabel = computed(() => {
  return registrationTabs.value.find(tab => tab.id === activeRegistrationTab.value)?.label || 'Registraties'
})

const tabFilteredRegistrations = computed(() => {
  if (activeRegistrationTab.value === 'approved') {
    return registrations.value.filter(isApprovedRegistration)
  }

  if (activeRegistrationTab.value === 'rejected') {
    return registrations.value.filter(isRejectedRegistration)
  }

  if (activeRegistrationTab.value === 'pending') {
    return registrations.value.filter(isPendingRegistration)
  }

  return registrations.value
})

const hasActiveRegistrationFilters = computed(() => {
  return Object.values(registrationFilters.value).some(value => String(value || '').trim() !== '')
})

const filteredRegistrations = computed(() => {
  const searchTerm = registrationFilters.value.search.trim().toLowerCase()
  const eventId = registrationFilters.value.eventId
  const transport = registrationFilters.value.transport
  const gender = registrationFilters.value.gender
  const dayCount = registrationFilters.value.dayCount
  const nightFilter = registrationFilters.value.nightFilter

  return tabFilteredRegistrations.value.filter(registration => {
    if (searchTerm) {
      const searchable = [
        registration.userName,
        registration.userEmail,
        registration.userPhone,
        registration.eventTitle,
        registration.churchName,
        genderText(registration.userGender)
      ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

      if (!searchable.includes(searchTerm)) return false
    }

    if (eventId && String(registration.eventId) !== eventId) {
      return false
    }

    if (transport === 'missing') {
      if (registration.transportOption) return false
    } else if (transport && registration.transportOption !== transport) {
      return false
    }

    if (gender === 'missing') {
      if (registration.userGender) return false
    } else if (gender && registration.userGender !== gender) {
      return false
    }

    if (dayCount) {
      const count = selectedDayCount(registration)

      if (dayCount === 'full') {
        if (count !== Number(registration.maxEventDays || count)) return false
      } else if (count !== Number(dayCount)) {
        return false
      }
    }

    if (nightFilter) {
      const nights = effectiveSelectedNights(registration)

      if (nightFilter === 'none' && nights.length !== 0) return false
      if (nightFilter === '1_night' && nights.length !== 1) return false
      if (nightFilter === '2_nights' && nights.length !== 2) return false
      if (nightFilter === 'night_1' && !nights.includes(1)) return false
      if (nightFilter === 'night_2' && !nights.includes(2)) return false
    }

    return true
  })
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
      .filter(isApprovedRegistration)
      .sort((a, b) => (a.userName || '').localeCompare(b.userName || '', 'nl'))
})

async function loadRegistrations() {
  registrations.value = await fetchAdminRegistrations()

  if (!selectedEventId.value && eventSummaries.value.length > 0) {
    selectedEventId.value = eventSummaries.value[0].id
  }
}

async function loadAuditLogs() {
  auditLogs.value = await fetchAdminAuditLogs()
}

async function refreshGoogleStatus() {
  try {
    googleStatus.value = await fetchGoogleSheetsStatus()
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
    await Promise.all([
      refreshGoogleStatus(),
      loadRegistrations(),
      loadAuditLogs()
    ])
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

function formatDateTime(date) {
  if (!date) return '-'

  return new Date(date).toLocaleString('nl-NL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function auditDetails(log) {
  if (!log?.details) return {}
  if (typeof log.details === 'object') return log.details

  try {
    return JSON.parse(log.details)
  } catch {
    return {}
  }
}

function auditActionText(log) {
  const details = auditDetails(log)

  if (String(log.action || '') === 'registration.cancelled') return 'Aanmelding geannuleerd'
  if (details.registrationStatus === 'rejected' || details.paymentStatus === 'rejected') return 'Afgewezen'
  if (['confirmed', 'approved', 'goedgekeurd'].includes(details.registrationStatus) || details.paymentStatus === 'paid') {
    return 'Goedgekeurd'
  }
  if (log.action === 'registration.custom_email_sent') return 'Persoonlijke mail gestuurd'
  if (log.action === 'registration.email_resent') return 'Statusmail opnieuw gestuurd'

  return 'Registratie aangepast'
}

function auditSubjectText(log) {
  const details = auditDetails(log)
  const name = details.userName || details.userEmail || `Registratie #${log.entityId || '-'}`
  const event = details.eventTitle ? ` · ${details.eventTitle}` : ''

  return `${name}${event}`
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

function paymentMethodText(method) {
  if (method === 'cash') return 'Cash'
  if (method === 'tikkie') return 'Tikkie / bewijs'

  return 'Nog niet gekozen'
}

function registrationStatusText(status) {
  if (status === 'pending') return 'In behandeling'
  if (status === 'confirmed') return 'Bevestigd'
  if (status === 'approved') return 'Goedgekeurd'
  if (status === 'goedgekeurd') return 'Goedgekeurd'
  if (status === 'rejected') return 'Afgewezen'
  if (status === 'cancelled') return 'Geannuleerd'

  return status || '-'
}

function parseSelection(value) {
  if (!value) return []

  return String(value)
      .split(',')
      .map(item => Number(item.trim()))
      .filter(Number.isInteger)
}

function isLegacyFullEventRegistration(registration) {
  const days = parseSelection(registration?.selectedDays)
  const maxDays = Number(registration?.maxEventDays || 1)
  const selectedPrice = Number(registration?.selectedPrice || 0)
  const fullEventPrice = Number(registration?.fullEventPrice || 0)

  if (!registration?.selectedDays && maxDays > 1) return true

  return maxDays > 1
      && days.length === 1
      && days[0] === 1
      && Number(registration?.selectedDayCount || 1) === 1
      && fullEventPrice > 0
      && selectedPrice >= fullEventPrice
}

function formatSelectedDays(registration) {
  if (!registration?.selectedDays || isLegacyFullEventRegistration(registration)) return 'Hele conferentie'

  return String(registration.selectedDays)
      .split(',')
      .map(day => `Dag ${day.trim()}`)
      .join(', ')
}

function isFullConferenceRegistration(registration) {
  const maxDays = Number(registration?.maxEventDays || registration?.selectedDayCount || 1)

  return maxDays > 1 && selectedDayCount(registration) >= maxDays
}

function attendanceTagList(registration) {
  if (isFullConferenceRegistration(registration)) return []

  return [
    formatSelectedDays(registration),
    formatSelectedNights(registration)
  ]
}

function fullEventNights(registration) {
  const maxDays = Math.min(3, Math.max(1, Number(registration?.maxEventDays || registration?.selectedDayCount || 1)))

  return Array.from({ length: Math.max(0, maxDays - 1) }, (_, index) => index + 1)
}

function effectiveSelectedNights(registration) {
  const nights = parseSelection(registration?.selectedNights)

  if (nights.length) return nights
  if (isLegacyFullEventRegistration(registration) && selectedDayCount(registration) > 1) return fullEventNights(registration)

  return []
}

function hasOvernightStay(registration) {
  return effectiveSelectedNights(registration).length > 0
}

function formatSelectedNights(registration) {
  const nights = effectiveSelectedNights(registration)

  if (nights.length === 0) return 'Geen overnachting'

  return nights
      .map(night => {
        if (night === 1) return 'Vrijdag op zaterdag'
        if (night === 2) return 'Zaterdag op zondag'
        return `Nacht ${night}`
      })
      .join(', ')
}

function attendanceTypeText(registration) {
  const nights = effectiveSelectedNights(registration)
  const dayCount = selectedDayCount(registration)

  if (isFullConferenceRegistration(registration)) return 'Hele conferentie'
  if (nights.length === 1) return '1 nacht'
  if (nights.length > 1) return `${nights.length} nachten`
  if (dayCount === 1) return '1 dag'
  if (dayCount > 1) return `${dayCount} dagen`

  return 'Niet ingevuld'
}

function attendanceSummaryText(registration) {
  return `${attendanceTypeText(registration)} · ${formatSelectedDays(registration)} · ${formatSelectedNights(registration)}`
}

function selectedDayCount(registration) {
  if (isLegacyFullEventRegistration(registration)) return Number(registration?.maxEventDays || registration?.selectedDayCount || 1)
  if (!registration?.selectedDays) return Number(registration?.maxEventDays || registration?.selectedDayCount || 1)
  if (registration.selectedDayCount) return Number(registration.selectedDayCount)

  return String(registration.selectedDays)
      .split(',')
      .map(day => day.trim())
      .filter(Boolean)
      .length
}

function transportOptionText(option) {
  if (option === 'own_transport') return 'Eigen vervoer'
  if (option === 'bus') return 'Bus tegen aanvullende kosten'

  return '-'
}

function genderText(gender) {
  if (gender === 'male') return 'Man'
  if (gender === 'female') return 'Vrouw'
  if (gender === 'other') return 'Anders / liever niet zeggen'

  return '-'
}

function clearRegistrationFilters() {
  registrationFilters.value = {
    search: '',
    eventId: '',
    transport: '',
    gender: '',
    dayCount: '',
    nightFilter: ''
  }
}

function isApprovedRegistration(registration) {
  return registration.paymentStatus === 'paid'
      && ['confirmed', 'approved', 'goedgekeurd'].includes(registration.registrationStatus)
}

function isRejectedRegistration(registration) {
  return registration.paymentStatus === 'rejected'
      || Boolean(registration.cancelledAt)
      || ['rejected', 'denied', 'afgewezen', 'cancelled', 'canceled', 'geannuleerd'].includes(registration.registrationStatus)
}

function isPendingRegistration(registration) {
  return !isApprovedRegistration(registration) && !isRejectedRegistration(registration)
}

function canResendRegistrationMail(registration) {
  return !!registration.userEmail
}

function selectEvent(eventId) {
  selectedEventId.value = eventId
}

function selectRegistration(registration) {
  selectedRegistration.value = registration
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
    const paymentMethod = registration.paymentMethod || (registration.hasPaymentProof ? 'tikkie' : 'cash')

    await updateRegistrationStatus(registration.id, {
      paymentStatus: 'paid',
      registrationStatus: 'confirmed',
      adminNote: registration.adminNote || null,
      paymentMethod
    })

    registration.paymentStatus = 'paid'
    registration.registrationStatus = 'confirmed'
    registration.paymentMethod = paymentMethod
    selectedRegistration.value = registration
    await loadAuditLogs()

    success.value = true
    message.value = `Registratie goedgekeurd (${paymentMethodText(paymentMethod)}). De gebruiker is nu officieel ingeschreven.`
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
      adminNote: registration.adminNote || null,
      paymentMethod: registration.paymentMethod || null
    })

    registration.paymentStatus = 'rejected'
    registration.registrationStatus = 'rejected'
    selectedRegistration.value = registration
    await loadAuditLogs()

    success.value = true
    message.value = 'Registratie afgewezen.'
  } catch (error) {
    success.value = false
    message.value = error.message
  }
}

async function restoreRegistrationToPending(registration) {
  try {
    await updateRegistrationStatus(registration.id, {
      paymentStatus: 'pending',
      registrationStatus: 'pending',
      adminNote: registration.adminNote || null,
      paymentMethod: registration.paymentMethod || null
    })

    registration.paymentStatus = 'pending'
    registration.registrationStatus = 'pending'
    registration.cancelledAt = null
    selectedRegistration.value = registration
    await loadAuditLogs()

    success.value = true
    message.value = 'Registratie teruggezet naar openstaand. Je kunt hem opnieuw beoordelen.'
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
      adminNote: registration.adminNote || null,
      paymentMethod: registration.paymentMethod || null
    })

    success.value = true
    message.value = 'Admin notitie opgeslagen.'
    await loadAuditLogs()
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

function openCustomEmailModal(registration) {
  emailModalRegistration.value = registration
  customEmail.value = {
    subject: `Vraag over je inschrijving voor ${registration.eventTitle}`,
    body: `Beste ${registration.userName || 'gebruiker'},\n\nWe hebben nog aanvullende informatie nodig om je inschrijving goed te kunnen verwerken.\n\nMet vriendelijke groet,\nDe organisatie`
  }
}

function closeCustomEmailModal() {
  emailModalRegistration.value = null
  customEmail.value = {
    subject: '',
    body: ''
  }
}

async function sendCustomEmail() {
  if (!emailModalRegistration.value) return

  emailSending.value = true

  try {
    await sendCustomRegistrationEmail(emailModalRegistration.value.id, {
      subject: customEmail.value.subject.trim(),
      body: customEmail.value.body.trim()
    })

    success.value = true
    message.value = `Mail naar ${emailModalRegistration.value.userName} wordt verstuurd.`
    closeCustomEmailModal()
  } catch (error) {
    success.value = false
    message.value = error.message
  } finally {
    emailSending.value = false
  }
}

async function exportCsvForEvent(registration) {
  try {
    await exportApprovedUsersCsv(registration.eventId, registration.eventTitle, 'approved')

    success.value = true
    message.value = 'Goedgekeurde deelnemerslijst is gedownload.'
  } catch (error) {
    success.value = false
    message.value = error.message
  }
}
</script>

<style scoped>
.admin-registrations {
  min-height: 100vh;
  background: #f7f4ee;
  padding-bottom: 80px;
}

/* HERO */
.registrations-hero {
  position: relative;
  overflow: hidden;
  min-height: 360px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 40px;
  padding: 90px max(4vw, 32px) 66px;
  background:
      linear-gradient(90deg, rgba(9, 17, 34, 0.9), rgba(9, 17, 34, 0.62)),
      url('../assets/home.png') center / cover;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
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
  min-height: 42px;
  border-radius: 10px;
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
  color: #ffffff;
  font-size: clamp(2.8rem, 5vw, 4.8rem);
  line-height: 0.96;
  letter-spacing: -0.08em;
}

.registrations-hero p {
  max-width: 680px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 1.08rem;
  line-height: 1.8;
}

.hero-count {
  width: 155px;
  height: 155px;
  display: grid;
  place-items: center;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.68);
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
  width: min(1400px, calc(100% - 56px));
  margin: 46px auto 0;
  display: flex;
  flex-direction: column;
}

.summary-grid {
  order: 3;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 34px;
}

.summary-grid div {
  padding: 24px;
  border-radius: 12px;
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
.audit-panel,
.access-card {
  padding: 30px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.07);
}

.event-export-panel {
  order: 2;
  margin-bottom: 34px;
}

.google-panel {
  order: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 34px;
}

.registrations-panel {
  order: 1;
  margin-bottom: 34px;
}

.audit-panel {
  order: 5;
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
  min-height: 42px;
  padding: 10px 13px;
  border-radius: 10px;
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

.audit-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
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

.registration-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 22px;
}

.tab-button {
  min-width: 138px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #475569;
  font-weight: 900;
}

.tab-button strong {
  min-width: 28px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: #e2e8f0;
  color: #0f172a;
  font-size: 0.82rem;
}

.tab-button.active {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
}

.tab-button.active strong {
  background: #2563eb;
  color: #ffffff;
}

.registration-filterbar {
  display: grid;
  grid-template-columns: minmax(220px, 1.4fr) repeat(4, minmax(140px, 1fr)) auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 12px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}

.registration-filterbar label {
  display: grid;
  gap: 7px;
}

.registration-filterbar span {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.registration-filterbar input,
.registration-filterbar select {
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  font-weight: 800;
}

.registration-filterbar input:focus,
.registration-filterbar select:focus {
  outline: 3px solid rgba(37, 99, 235, 0.16);
  border-color: #2563eb;
}

.clear-filters-button {
  min-height: 44px;
  padding: 0 15px;
  border: 0;
  border-radius: 9px;
  background: #e2e8f0;
  color: #334155;
  font-weight: 900;
}

.clear-filters-button:not(:disabled):hover {
  background: #0f172a;
  color: #ffffff;
}

.clear-filters-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.filter-result-count {
  margin-bottom: 14px;
  color: #64748b;
  font-size: 0.88rem;
  font-weight: 800;
}

.audit-list {
  display: grid;
  gap: 10px;
}

.audit-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 0;
  border-top: 1px solid #e2e8f0;
}

.audit-item:first-child {
  border-top: 0;
}

.audit-item div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.audit-item strong {
  color: #0f172a;
}

.audit-item span,
.audit-item p {
  color: #64748b;
  line-height: 1.45;
}

.audit-item span {
  overflow-wrap: anywhere;
}

.audit-item p {
  flex: 0 0 auto;
  margin: 0;
  font-size: 0.84rem;
  font-weight: 800;
  white-space: nowrap;
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
  border-radius: 12px;
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
  border-radius: 10px;
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
  min-height: 42px;
  padding: 10px 13px;
  border-radius: 10px;
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
  border-radius: 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

.registrations-panel tbody tr {
  cursor: pointer;
  transition: 0.18s ease;
}

.registrations-panel tbody tr:hover,
.registrations-panel tbody tr.selected {
  background: #f8fafc;
}

.registrations-panel tbody tr.selected {
  box-shadow: inset 3px 0 0 #2563eb;
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

.registrations-panel tbody tr.detail-row {
  background: transparent;
}

.registrations-panel tbody tr.detail-row:hover {
  background: transparent;
}

.detail-row > td {
  padding: 0 0 18px;
  border-bottom: 1px solid #e2e8f0;
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

.user-cell .user-phone {
  color: #0f172a;
  font-size: 0.84rem;
  font-weight: 800;
}

.extra-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
}

.attendance-cell {
  display: grid;
  gap: 8px;
  min-width: 210px;
}

.attendance-cell > strong {
  color: #0f172a;
  font-size: 0.96rem;
}

.attendance-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.attendance-tags span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 5px 9px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e3a8a;
  font-size: 0.76rem;
  font-weight: 900;
  line-height: 1.2;
}

.attendance-tags span.muted {
  border-color: #e2e8f0;
  background: #f8fafc;
  color: #64748b;
}

/* STATUS */
.payment-cell {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 7px 11px;
  border-radius: 10px;
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

.payment-method-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 6px 10px;
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  background: #ffffff;
  color: #475569;
  font-size: 0.74rem;
  font-weight: 900;
  line-height: 1.2;
  white-space: nowrap;
}

/* BUTTONS */
.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.proof-button,
.details-button,
.restore-button,
.approve-button,
.reject-button {
  min-height: 44px;
  padding: 10px 13px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 900;
  transition: 0.2s ease;
  white-space: nowrap;
}

.payment-method-select {
  width: 150px;
  min-height: 40px;
  padding: 9px 11px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 900;
  outline: none;
}

.payment-method-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.proof-button {
  background: #f1f5f9;
  color: #0f172a;
}

.proof-button:hover {
  background: #e2e8f0;
}

.details-button {
  background: #f1f5f9;
  color: #0f172a;
}

.details-button:hover {
  background: #e2e8f0;
}

.restore-button {
  background: #fff7ed;
  color: #9a3412;
}

.restore-button:hover {
  background: #ffedd5;
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

.registration-detail-panel {
  margin: 0;
  padding: 22px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  background: #f8fafc;
}

.detail-panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.detail-panel-heading h3 {
  margin-bottom: 5px;
  color: #0f172a;
  font-size: clamp(1.35rem, 2.4vw, 2rem);
  letter-spacing: -0.04em;
}

.detail-panel-heading p:not(.eyebrow) {
  color: #64748b;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.detail-grid div {
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
}

.detail-grid span {
  display: block;
  margin-bottom: 6px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-grid strong {
  color: #0f172a;
  overflow-wrap: anywhere;
}

.admin-note-field {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.admin-note-field span {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin-note-field textarea {
  width: 100%;
  min-height: 92px;
  padding: 13px 14px;
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  resize: vertical;
}

.admin-note-field textarea:focus {
  outline: 3px solid rgba(37, 99, 235, 0.16);
  border-color: #2563eb;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.55);
}

.email-modal {
  width: min(640px, 100%);
  padding: 26px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
}

.modal-heading {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.modal-heading h2 {
  margin-bottom: 6px;
  color: #0f172a;
  font-size: 1.8rem;
  letter-spacing: -0.04em;
}

.modal-heading p {
  color: #64748b;
}

.icon-button {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f1f5f9;
  color: #0f172a;
  font-weight: 900;
}

.icon-button:hover {
  background: #e2e8f0;
}

.modal-field {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.modal-field span {
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.modal-field input,
.modal-field textarea {
  width: 100%;
  padding: 13px 14px;
  border: 1px solid #dbe3ee;
  border-radius: 10px;
  background: #f8fafc;
  color: #0f172a;
  font: inherit;
  resize: vertical;
}

.modal-field input:focus,
.modal-field textarea:focus {
  outline: none;
  border-color: #2563eb;
  background: #ffffff;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
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

  .registration-filterbar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .registration-filterbar .search-field,
  .clear-filters-button {
    grid-column: 1 / -1;
  }

  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 780px) {
  .registrations-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .export-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .audit-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .export-heading .secondary-button {
    width: 100%;
    white-space: normal;
  }

  .audit-heading .secondary-button {
    width: 100%;
  }

  .hero-count {
    width: 100%;
    height: auto;
    min-height: 88px;
    display: flex;
    justify-content: space-between;
    padding: 18px;
    border-radius: 14px;
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

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .registrations-content {
    width: calc(100% - 28px);
    margin-top: 28px;
  }

  .registrations-panel,
  .event-export-panel,
  .google-panel,
  .audit-panel {
    padding: 18px;
    border-radius: 12px;
  }

  .google-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .preview-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .payment-method-select {
    width: 100%;
    min-width: 150px;
  }

  .registration-filterbar {
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .registration-filterbar .search-field,
  .clear-filters-button {
    grid-column: auto;
  }

  .registration-filterbar input,
  .registration-filterbar select,
  .clear-filters-button {
    min-height: 48px;
  }

  .registrations-panel .table-wrapper {
    overflow: visible;
  }

  .registrations-panel table,
  .registrations-panel thead,
  .registrations-panel tbody,
  .registrations-panel tr,
  .registrations-panel td {
    display: block;
    width: 100%;
  }

  .registrations-panel thead {
    display: none;
  }

  .registrations-panel tr {
    margin-bottom: 14px;
    padding: 14px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #ffffff;
  }

  .registrations-panel td {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    gap: 14px;
    padding: 10px 0;
    border-bottom: 1px solid #edf2f7;
  }

  .registrations-panel td:last-child {
    border-bottom: 0;
  }

  .registrations-panel td::before {
    content: attr(data-label);
    color: #64748b;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .registrations-panel tr.detail-row {
    margin-top: -10px;
    padding: 0;
    border: 0;
    background: transparent;
  }

  .registrations-panel tr.detail-row td {
    display: block;
    padding: 0 0 14px;
    border-bottom: 0;
  }

  .registrations-panel tr.detail-row td::before {
    content: none;
  }

  .action-buttons {
    display: grid;
    grid-template-columns: 1fr;
  }

  .event-export-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .event-export-actions > * {
    width: 100%;
  }

  .audit-item {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .audit-item p {
    white-space: normal;
  }

  .detail-panel-heading,
  .detail-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-actions > * {
    width: 100%;
  }
}
</style>
