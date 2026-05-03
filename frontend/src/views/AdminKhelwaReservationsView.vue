<template>
  <section class="admin-page">
    <div class="admin-hero">
      <div>
        <span class="badge">Khelwa beheer</span>
        <h1>Beheer alle Khelwa reserveringen</h1>
        <p>
          Bekijk aanvragen, keur reserveringen goed of af en sluit meerdere dagen
          tegelijk via de kalender.
        </p>
      </div>

      <button class="refresh-btn" @click="refreshAll">
        Verversen
      </button>
    </div>

    <div class="stats-grid">
      <button
          class="stat-card"
          :class="{ active: filterStatus === 'all' }"
          @click="filterStatus = 'all'"
      >
        <strong>{{ reservations.length }}</strong>
        <span>Totaal</span>
      </button>

      <button
          class="stat-card"
          :class="{ active: filterStatus === 'pending' }"
          @click="filterStatus = 'pending'"
      >
        <strong>{{ pendingCount }}</strong>
        <span>In behandeling</span>
      </button>

      <button
          class="stat-card"
          :class="{ active: filterStatus === 'approved' }"
          @click="filterStatus = 'approved'"
      >
        <strong>{{ approvedCount }}</strong>
        <span>Goedgekeurd</span>
      </button>

      <button
          class="stat-card"
          :class="{ active: filterStatus === 'rejected' }"
          @click="filterStatus = 'rejected'"
      >
        <strong>{{ rejectedCount }}</strong>
        <span>Afgekeurd</span>
      </button>
    </div>

    <div class="tools-grid">
      <div class="tool-card search-card">
        <h2>Zoeken</h2>
        <input
            v-model="searchTerm"
            type="text"
            placeholder="Zoek op naam of e-mail..."
        />
      </div>

      <div class="tool-card calendar-tool">
        <div class="mini-calendar-top">
          <button type="button" @click="previousMonth">‹</button>
          <h2>{{ monthLabel }}</h2>
          <button type="button" @click="nextMonth">›</button>
        </div>

        <div class="mini-weekdays">
          <span>Ma</span>
          <span>Di</span>
          <span>Wo</span>
          <span>Do</span>
          <span>Vr</span>
          <span>Za</span>
          <span>Zo</span>
        </div>

        <div class="mini-calendar-grid">
          <div
              v-for="empty in emptyDays"
              :key="'empty-admin-' + empty"
              class="mini-day empty"
          ></div>

          <button
              v-for="day in availability"
              :key="day.date"
              type="button"
              class="mini-day"
              :class="{
              selected: isBlockedDateSelected(day.date),
              closed: day.blocked
            }"
              @click="toggleBlockedDate(day.date)"
          >
            <strong>{{ getDayNumber(day.date) }}</strong>
            <small v-if="day.blocked">Gesloten</small>
            <small v-else>{{ day.available_spots }} vrij</small>
          </button>
        </div>

        <div class="block-actions">
          <input
              v-model="blockedReason"
              type="text"
              placeholder="Reden, bijvoorbeeld event"
          />

          <button
              type="button"
              :disabled="blocking || selectedBlockedDates.length === 0"
              @click="blockSelectedDates"
          >
            {{ blocking ? "Sluiten..." : "Geselecteerde dagen sluiten" }}
          </button>
        </div>

        <p v-if="selectedBlockedDates.length" class="selected-count">
          {{ selectedBlockedDates.length }} dag(en) geselecteerd
        </p>

        <p v-if="blockMessage" class="small-message" :class="{ error: blockError }">
          {{ blockMessage }}
        </p>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-header">
        <div>
          <h2>Reserveringsaanvragen</h2>
          <p>{{ filteredReservations.length }} resultaat/resultaten gevonden.</p>
        </div>
      </div>

      <div v-if="loading" class="empty-state">
        Reserveringen laden...
      </div>

      <div v-else-if="filteredReservations.length === 0" class="empty-state">
        Geen reserveringen gevonden.
      </div>

      <div v-else class="reservations">
        <article
            v-for="reservation in filteredReservations"
            :key="reservation.id"
            class="reservation-card"
        >
          <div class="reservation-main">
            <div class="person">
              <h3>{{ reservation.requester_name }}</h3>
              <p>{{ reservation.requester_email }}</p>
              <p v-if="reservation.requester_phone">
                {{ reservation.requester_phone }}
              </p>
            </div>

            <span :class="['status', reservation.status]">
              {{ statusLabel(reservation.status) }}
            </span>
          </div>

          <div class="details">
            <span>
              {{ formatDate(reservation.start_date) }} -
              {{ formatDate(reservation.end_date) }}
            </span>
            <span>{{ reservation.group_size }} personen</span>
            <span>{{ reservationTypeLabel(reservation.reservation_type) }}</span>
            <span>{{ stayTypeLabel(reservation.stay_type) }}</span>
          </div>

          <div class="note-row">
            <textarea
                v-model="notes[reservation.id]"
                placeholder="Admin opmerking..."
                :disabled="reservation.status !== 'pending'"
            ></textarea>

            <div v-if="reservation.status === 'pending'" class="actions">
              <button
                  class="approve"
                  :disabled="actionLoadingId === reservation.id"
                  @click="approve(reservation.id)"
              >
                Goedkeuren
              </button>

              <button
                  class="reject"
                  :disabled="actionLoadingId === reservation.id"
                  @click="reject(reservation.id)"
              >
                Afkeuren
              </button>
            </div>
          </div>

          <p v-if="reservation.admin_note" class="admin-note">
            <strong>Opmerking:</strong> {{ reservation.admin_note }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<script>
import {
  getAdminKhelwaReservations,
  approveKhelwaReservation,
  rejectKhelwaReservation,
  blockKhelwaDate,
  getKhelwaAvailability
} from "../services/khelwaApi"

export default {
  name: "AdminKhelwaReservationsView",

  data() {
    const today = new Date()

    return {
      reservations: [],
      notes: {},
      loading: false,
      actionLoadingId: null,

      filterStatus: "pending",
      searchTerm: "",

      currentDate: new Date(today.getFullYear(), today.getMonth(), 1),
      availability: [],

      selectedBlockedDates: [],
      blockedReason: "",
      blocking: false,
      blockMessage: "",
      blockError: false
    }
  },

  computed: {
    pendingCount() {
      return this.reservations.filter((r) => r.status === "pending").length
    },

    approvedCount() {
      return this.reservations.filter((r) => r.status === "approved").length
    },

    rejectedCount() {
      return this.reservations.filter((r) => r.status === "rejected").length
    },

    filteredReservations() {
      let result = this.reservations

      if (this.filterStatus !== "all") {
        result = result.filter((r) => r.status === this.filterStatus)
      }

      const search = this.searchTerm.trim().toLowerCase()

      if (search) {
        result = result.filter((r) => {
          const name = String(r.requester_name || "").toLowerCase()
          const email = String(r.requester_email || "").toLowerCase()
          const phone = String(r.requester_phone || "").toLowerCase()

          return (
              name.includes(search) ||
              email.includes(search) ||
              phone.includes(search)
          )
        })
      }

      return result
    },

    currentMonth() {
      const year = this.currentDate.getFullYear()
      const month = String(this.currentDate.getMonth() + 1).padStart(2, "0")
      return `${year}-${month}`
    },

    monthLabel() {
      return this.currentDate.toLocaleDateString("nl-NL", {
        month: "long",
        year: "numeric"
      })
    },

    emptyDays() {
      const firstDay = new Date(
          this.currentDate.getFullYear(),
          this.currentDate.getMonth(),
          1
      ).getDay()

      return firstDay === 0 ? 6 : firstDay - 1
    }
  },

  mounted() {
    this.refreshAll()
  },

  methods: {
    async refreshAll() {
      await Promise.all([
        this.loadReservations(),
        this.loadAvailability()
      ])
    },

    async loadReservations() {
      this.loading = true

      const result = await getAdminKhelwaReservations()

      if (result.success) {
        this.reservations = result.data

        result.data.forEach((reservation) => {
          this.notes[reservation.id] = reservation.admin_note || ""
        })
      }

      this.loading = false
    },

    async loadAvailability() {
      const result = await getKhelwaAvailability(this.currentMonth)

      if (result.success) {
        this.availability = result.data
      }
    },

    previousMonth() {
      this.currentDate = new Date(
          this.currentDate.getFullYear(),
          this.currentDate.getMonth() - 1,
          1
      )

      this.selectedBlockedDates = []
      this.blockMessage = ""
      this.blockError = false
      this.loadAvailability()
    },

    nextMonth() {
      this.currentDate = new Date(
          this.currentDate.getFullYear(),
          this.currentDate.getMonth() + 1,
          1
      )

      this.selectedBlockedDates = []
      this.blockMessage = ""
      this.blockError = false
      this.loadAvailability()
    },

    getDayNumber(date) {
      return Number(date.split("-")[2])
    },

    toggleBlockedDate(date) {
      this.blockMessage = ""
      this.blockError = false

      if (this.selectedBlockedDates.includes(date)) {
        this.selectedBlockedDates = this.selectedBlockedDates.filter(
            (selectedDate) => selectedDate !== date
        )
      } else {
        this.selectedBlockedDates.push(date)
      }
    },

    isBlockedDateSelected(date) {
      return this.selectedBlockedDates.includes(date)
    },

    async blockSelectedDates() {
      this.blocking = true
      this.blockMessage = ""
      this.blockError = false

      if (this.selectedBlockedDates.length === 0) {
        this.blocking = false
        this.blockError = true
        this.blockMessage = "Selecteer minimaal één dag."
        return
      }

      for (const date of this.selectedBlockedDates) {
        const result = await blockKhelwaDate(date, this.blockedReason)

        if (!result.success) {
          this.blocking = false
          this.blockError = true
          this.blockMessage =
              result.message || "Een of meerdere dagen konden niet worden gesloten."
          return
        }
      }

      this.blockMessage = "Geselecteerde dagen zijn gesloten voor reserveringen."
      this.selectedBlockedDates = []
      this.blockedReason = ""

      await this.loadAvailability()

      this.blocking = false
    },

    async approve(id) {
      this.actionLoadingId = id
      await approveKhelwaReservation(id, this.notes[id])
      await this.loadReservations()
      await this.loadAvailability()
      this.actionLoadingId = null
    },

    async reject(id) {
      this.actionLoadingId = id
      await rejectKhelwaReservation(id, this.notes[id])
      await this.loadReservations()
      await this.loadAvailability()
      this.actionLoadingId = null
    },

    formatDate(date) {
      if (!date) return "-"
      return new Date(date).toLocaleDateString("nl-NL")
    },

    statusLabel(status) {
      if (status === "pending") return "In behandeling"
      if (status === "approved") return "Goedgekeurd"
      if (status === "rejected") return "Afgekeurd"
      return status
    },

    reservationTypeLabel(type) {
      if (type === "single") return "Alleen"
      if (type === "group") return "Groep"
      return type
    },

    stayTypeLabel(type) {
      if (type === "day") return "Dagbezoek"
      if (type === "overnight") return "Overnachten"
      return type
    }
  }
}
</script>

<style scoped>
.admin-page {
  --dark: #231914;
  --brown: #7a573d;
  --brown-2: #9b7658;

  display: flex;
  flex-direction: column;
  gap: 18px;
  animation: pageIn 0.45s ease both;
}

.admin-hero,
.admin-card,
.stat-card,
.tool-card {
  position: relative;
  background:
      linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,250,244,0.9)),
      radial-gradient(circle at top right, rgba(122,87,61,0.12), transparent 34%);
  border: 1px solid rgba(122, 87, 61, 0.14);
  box-shadow: 0 18px 46px rgba(35, 25, 20, 0.09);
  overflow: hidden;
  clip-path: polygon(
      0 0,
      calc(100% - 22px) 0,
      100% 22px,
      100% 100%,
      22px 100%,
      0 calc(100% - 22px)
  );
}

.admin-hero {
  padding: 28px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
}

.badge {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  color: var(--brown);
  font-size: 11px;
  font-weight: 950;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.badge::before {
  content: "";
  width: 28px;
  height: 2px;
  background: var(--brown);
  margin-right: 10px;
}

.admin-hero h1 {
  position: relative;
  z-index: 1;
  margin: 0;
  color: var(--dark);
  font-size: clamp(30px, 4vw, 48px);
  line-height: 0.95;
  letter-spacing: -0.07em;
  font-weight: 950;
}

.admin-hero p {
  position: relative;
  z-index: 1;
  margin: 12px 0 0;
  color: rgba(35,25,20,0.65);
  font-size: 14px;
  line-height: 1.6;
  font-weight: 650;
}

.refresh-btn,
.block-actions button,
.actions button {
  position: relative;
  z-index: 1;
  border: 0;
  color: white;
  padding: 12px 16px;
  font-weight: 950;
  cursor: pointer;
  transition: 0.18s ease;
  background: linear-gradient(135deg, #2f241d, #7a573d);
  clip-path: polygon(
      0 0,
      calc(100% - 12px) 0,
      100% 12px,
      100% 100%,
      12px 100%,
      0 calc(100% - 12px)
  );
}

.refresh-btn:hover,
.block-actions button:hover,
.actions button:hover {
  transform: translateY(-2px);
  filter: brightness(1.08);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.stat-card {
  padding: 18px;
  text-align: left;
  cursor: pointer;
  color: inherit;
  border: 1px solid rgba(122, 87, 61, 0.14);
}

.stat-card.active {
  background: linear-gradient(135deg, #2f241d, #7a573d);
  color: white;
}

.stat-card strong {
  position: relative;
  z-index: 1;
  display: block;
  color: var(--dark);
  font-size: 30px;
  font-weight: 950;
  letter-spacing: -0.06em;
}

.stat-card.active strong {
  color: white;
}

.stat-card span {
  position: relative;
  z-index: 1;
  font-size: 13px;
  font-weight: 850;
  color: rgba(35,25,20,0.62);
}

.stat-card.active span {
  color: rgba(255,255,255,0.78);
}

.tools-grid {
  display: grid;
  grid-template-columns: 0.7fr 1.3fr;
  gap: 14px;
  align-items: start;
}

.tool-card {
  padding: 18px;
}

.tool-card h2 {
  position: relative;
  z-index: 1;
  margin: 0 0 12px;
  color: var(--dark);
  font-size: 20px;
  font-weight: 950;
  letter-spacing: -0.05em;
}

.search-card input {
  margin-top: 2px;
}

.mini-calendar-top {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 42px 1fr 42px;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.mini-calendar-top h2 {
  margin: 0;
  color: var(--dark);
  font-size: 22px;
  font-weight: 950;
  letter-spacing: -0.05em;
  text-align: center;
  text-transform: capitalize;
}

.mini-calendar-top button {
  border: 0;
  height: 42px;
  color: white;
  background: linear-gradient(135deg, #2f241d, #7a573d);
  font-size: 24px;
  cursor: pointer;
  transition: 0.18s ease;
  clip-path: polygon(
      0 0,
      calc(100% - 10px) 0,
      100% 10px,
      100% 100%,
      10px 100%,
      0 calc(100% - 10px)
  );
}

.mini-calendar-top button:hover {
  transform: translateY(-2px);
  filter: brightness(1.08);
}

.mini-weekdays,
.mini-calendar-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 7px;
}

.mini-weekdays {
  margin-bottom: 8px;
}

.mini-weekdays span {
  text-align: center;
  color: rgba(35,25,20,0.5);
  font-size: 10px;
  font-weight: 950;
  text-transform: uppercase;
}

.mini-day {
  min-height: 58px;
  border: 1px solid rgba(122,87,61,0.15);
  background: rgba(255,250,244,0.84);
  color: var(--dark);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  transition: 0.18s ease;
  clip-path: polygon(
      0 0,
      calc(100% - 10px) 0,
      100% 10px,
      100% 100%,
      10px 100%,
      0 calc(100% - 10px)
  );
}

.mini-day:hover:not(.empty) {
  transform: translateY(-2px);
  border-color: rgba(122,87,61,0.36);
}

.mini-day strong {
  font-size: 17px;
  font-weight: 950;
}

.mini-day small {
  font-size: 10px;
  font-weight: 850;
  color: rgba(35,25,20,0.56);
}

.mini-day.selected {
  background: linear-gradient(135deg, #2f241d, #7a573d);
  color: white;
  border-color: transparent;
}

.mini-day.selected small {
  color: rgba(255,255,255,0.78);
}

.mini-day.closed {
  background: rgba(155, 28, 28, 0.12);
  color: #9b1c1c;
}

.mini-day.closed small {
  color: #9b1c1c;
}

.mini-day.closed.selected {
  background: linear-gradient(135deg, #9b1c1c, #5f1111);
  color: white;
}

.mini-day.closed.selected small {
  color: rgba(255,255,255,0.78);
}

.empty {
  background: transparent;
  border: 0;
  pointer-events: none;
}

.block-actions {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  margin-top: 14px;
}

.block-actions button:disabled,
.actions button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.selected-count {
  position: relative;
  z-index: 1;
  margin: 10px 0 0;
  color: rgba(35,25,20,0.58);
  font-size: 13px;
  font-weight: 800;
}

input,
textarea {
  position: relative;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(122,87,61,0.18);
  background: rgba(255,250,244,0.82);
  color: var(--dark);
  padding: 12px 13px;
  font-size: 14px;
  font-family: inherit;
  font-weight: 700;
  outline: none;
  clip-path: polygon(
      0 0,
      calc(100% - 10px) 0,
      100% 10px,
      100% 100%,
      10px 100%,
      0 calc(100% - 10px)
  );
}

textarea {
  min-height: 54px;
  resize: vertical;
}

input:focus,
textarea:focus {
  background: white;
  border-color: rgba(122,87,61,0.55);
  box-shadow: 0 0 0 3px rgba(122,87,61,0.1);
}

.admin-card {
  padding: 22px;
}

.admin-header {
  position: relative;
  z-index: 1;
  margin-bottom: 18px;
}

.admin-header h2 {
  margin: 0;
  color: var(--dark);
  font-size: 28px;
  line-height: 1;
  letter-spacing: -0.06em;
  font-weight: 950;
}

.admin-header p {
  margin: 8px 0 0;
  color: rgba(35,25,20,0.6);
  font-size: 13px;
  font-weight: 700;
}

.empty-state {
  position: relative;
  z-index: 1;
  padding: 26px;
  text-align: center;
  color: rgba(35,25,20,0.65);
  font-weight: 850;
}

.reservations {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 12px;
}

.reservation-card {
  background:
      linear-gradient(145deg, rgba(255,250,244,0.95), rgba(246,239,230,0.72));
  border: 1px solid rgba(122,87,61,0.13);
  padding: 16px;
  clip-path: polygon(
      0 0,
      calc(100% - 16px) 0,
      100% 16px,
      100% 100%,
      16px 100%,
      0 calc(100% - 16px)
  );
}

.reservation-main {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.person h3 {
  margin: 0;
  color: var(--dark);
  font-size: 20px;
  font-weight: 950;
  letter-spacing: -0.04em;
}

.person p {
  margin: 5px 0 0;
  color: rgba(35,25,20,0.62);
  font-size: 13px;
  font-weight: 700;
}

.status {
  height: fit-content;
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 950;
  white-space: nowrap;
}

.status.pending {
  background: #fff3cd;
  color: #856404;
}

.status.approved {
  background: #d4edda;
  color: #155724;
}

.status.rejected {
  background: #f8d7da;
  color: #721c24;
}

.details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0;
}

.details span {
  background: rgba(255,255,255,0.72);
  border: 1px solid rgba(122,87,61,0.08);
  border-radius: 999px;
  padding: 7px 10px;
  color: #4a3a30;
  font-size: 12px;
  font-weight: 850;
}

.note-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: start;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions button {
  padding: 11px 14px;
  white-space: nowrap;
}

.approve {
  background: linear-gradient(135deg, #2e7d32, #1b5e20) !important;
}

.reject {
  background: linear-gradient(135deg, #c62828, #8e1b1b) !important;
}

.admin-note,
.small-message {
  position: relative;
  z-index: 1;
  margin: 12px 0 0;
  padding: 10px 12px;
  background: rgba(255,255,255,0.72);
  border: 1px solid rgba(122,87,61,0.08);
  color: #4a3a30;
  font-size: 13px;
  font-weight: 700;
}

.small-message {
  color: #256029;
}

.small-message.error {
  background: rgba(253,236,234,0.95);
  color: #9b1c1c;
}

@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 950px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }

  .block-actions {
    grid-template-columns: 1fr;
  }

  .note-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 650px) {
  .admin-hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 22px;
  }

  .refresh-btn {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .reservation-main {
    flex-direction: column;
  }

  .actions {
    flex-direction: column;
  }

  .actions button {
    width: 100%;
  }

  .mini-day {
    min-height: 48px;
  }

  .mini-day small {
    display: none;
  }
}
</style>