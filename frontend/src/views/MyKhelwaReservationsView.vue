<template>
  <section class="my-page">
    <div class="mini-hero">
      <span class="badge">Mijn reserveringen</span>
      <h1>Bekijk jouw Khelwa aanvragen</h1>
      <p>
        Hier zie je jouw reserveringen, de status van je aanvraag en eventuele opmerkingen van de admin.
      </p>
    </div>

    <div class="my-card">
      <div class="my-header">
        <div>
          <h2>Reserveringsoverzicht</h2>
          <p>Alle Khelwa reserveringen die aan jouw account gekoppeld zijn.</p>
        </div>

        <button @click="loadReservations">Verversen</button>
      </div>

      <div v-if="loading" class="empty-state">
        Reserveringen laden...
      </div>

      <div v-else-if="reservations.length === 0" class="empty-state">
        Je hebt nog geen Khelwa reserveringen.
      </div>

      <div v-else class="reservations">
        <div
            v-for="reservation in reservations"
            :key="reservation.id"
            class="reservation-card"
        >
          <div class="reservation-top">
            <div>
              <h3>{{ reservation.requester_name }}</h3>
              <p>{{ reservation.requester_email }}</p>
            </div>

            <span :class="['status', reservation.status]">
              {{ statusLabel(reservation.status) }}
            </span>
          </div>

          <div class="details">
            <span>Van: {{ formatDate(reservation.start_date) }}</span>
            <span>Tot: {{ formatDate(reservation.end_date) }}</span>
            <span>Personen: {{ reservation.group_size }}</span>
            <span>Type: {{ reservation.reservation_type }}</span>
            <span>Verblijf: {{ reservation.stay_type }}</span>
          </div>

          <p v-if="reservation.admin_note" class="admin-note">
            <strong>Admin opmerking:</strong> {{ reservation.admin_note }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { getMyKhelwaReservations } from "../services/khelwaApi"

export default {
  name: "MyKhelwaReservationsView",

  data() {
    return {
      reservations: [],
      loading: false
    }
  },

  mounted() {
    this.loadReservations()
  },

  methods: {
    async loadReservations() {
      this.loading = true

      const result = await getMyKhelwaReservations()

      if (result.success) {
        this.reservations = result.data
      }

      this.loading = false
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
    }
  }
}
</script>

<style scoped>
.my-page {
  --ink: #2f2418;
  --coptic-red: #8f2f24;
  --deep-red: #5b241d;
  --gold: #c99a3e;
  --cream: #fff8ec;
  --paper: #fffaf1;

  display: flex;
  flex-direction: column;
  gap: 28px;
  animation: pageIn 0.6s ease both;
}

.mini-hero,
.my-card {
  position: relative;
  background:
      linear-gradient(180deg, rgba(255,250,241,0.98), rgba(251,243,229,0.94)),
      radial-gradient(circle at top right, rgba(201,154,62,0.16), transparent 36%);
  border: 1px solid rgba(201,154,62,0.35);
  border-radius: 28px;
  box-shadow:
      0 24px 60px rgba(47,36,24,0.11),
      inset 0 1px 0 rgba(255,255,255,0.85);
  overflow: hidden;
}

.mini-hero::before,
.my-card::before {
  content: "✣";
  position: absolute;
  right: 28px;
  top: 22px;
  color: rgba(201,154,62,0.24);
  font-size: 76px;
  line-height: 1;
  pointer-events: none;
}

.mini-hero::after,
.my-card::after {
  content: "";
  position: absolute;
  inset: 14px;
  border: 1px solid rgba(201,154,62,0.24);
  border-radius: 22px;
  pointer-events: none;
}

.mini-hero {
  padding: 46px;
}

.badge {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  color: var(--coptic-red);
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.badge::before,
.badge::after {
  content: "";
  width: 28px;
  height: 1px;
  background: var(--gold);
}

.badge::before {
  margin-right: 12px;
}

.badge::after {
  margin-left: 12px;
}

.mini-hero h1 {
  position: relative;
  z-index: 1;
  max-width: 850px;
  margin: 0;
  color: var(--ink);
  font-size: clamp(38px, 5vw, 62px);
  line-height: 1.05;
  letter-spacing: -0.045em;
  font-weight: 900;
}

.mini-hero p {
  position: relative;
  z-index: 1;
  max-width: 760px;
  margin: 20px 0 0;
  color: rgba(47,36,24,0.68);
  font-size: 16px;
  line-height: 1.8;
  font-weight: 600;
}

.my-card {
  padding: 34px;
}

.my-header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  gap: 20px;
}

.my-header h2 {
  margin: 0;
  color: var(--ink);
  font-size: clamp(30px, 4vw, 44px);
  line-height: 1.05;
  letter-spacing: -0.045em;
  font-weight: 900;
}

.my-header p {
  margin: 12px 0 0;
  color: rgba(47,36,24,0.68);
  font-weight: 600;
}

.my-header button {
  border: 1px solid rgba(201,154,62,0.52);
  color: #fffaf1;
  background: linear-gradient(135deg, var(--coptic-red), var(--deep-red));
  padding: 14px 22px;
  font-weight: 850;
  cursor: pointer;
  border-radius: 999px;
  box-shadow: 0 16px 30px rgba(143,47,36,0.2);
  transition: 0.18s ease;
}

.my-header button:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 36px rgba(143,47,36,0.26);
}

.empty-state {
  position: relative;
  z-index: 1;
  padding: 34px;
  text-align: center;
  color: rgba(47,36,24,0.68);
  font-weight: 800;
}

.reservations {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 18px;
}

.reservation-card {
  position: relative;
  background:
      linear-gradient(180deg, rgba(255,250,241,0.96), rgba(251,243,229,0.78));
  border: 1px solid rgba(201,154,62,0.28);
  padding: 24px;
  border-radius: 22px;
  overflow: hidden;
  transition: 0.18s ease;
}

.reservation-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 34px rgba(47,36,24,0.12);
  border-color: rgba(201,154,62,0.56);
}

.reservation-card::before {
  content: "✣";
  position: absolute;
  right: 18px;
  top: 14px;
  color: rgba(201,154,62,0.2);
  font-size: 34px;
  pointer-events: none;
}

.reservation-top {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.reservation-top h3 {
  margin: 0;
  color: var(--ink);
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.035em;
}

.reservation-top p {
  margin: 7px 0 0;
  color: rgba(47,36,24,0.62);
  font-weight: 650;
}

.status {
  height: fit-content;
  padding: 9px 14px;
  border-radius: 999px;
  font-weight: 850;
  white-space: nowrap;
  border: 1px solid transparent;
}

.status.pending {
  background: rgba(255,243,205,0.9);
  color: #856404;
  border-color: rgba(201,154,62,0.28);
}

.status.approved {
  background: rgba(212,237,218,0.92);
  color: #155724;
  border-color: rgba(21,87,36,0.12);
}

.status.rejected {
  background: rgba(248,215,218,0.92);
  color: #721c24;
  border-color: rgba(114,28,36,0.12);
}

.details {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.details span {
  background: rgba(255,250,241,0.76);
  border: 1px solid rgba(201,154,62,0.26);
  border-radius: 999px;
  padding: 9px 13px;
  color: #4a3a30;
  font-weight: 750;
}

.admin-note {
  position: relative;
  z-index: 1;
  background: rgba(255,250,241,0.78);
  border: 1px solid rgba(201,154,62,0.28);
  padding: 14px;
  border-radius: 16px;
  margin-top: 18px;
  color: #4a3a30;
  font-weight: 650;
  line-height: 1.55;
}

.admin-note strong {
  color: var(--coptic-red);
}

@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateY(22px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 700px) {
  .mini-hero,
  .my-card {
    padding: 24px;
    border-radius: 22px;
  }

  .mini-hero::after,
  .my-card::after {
    inset: 10px;
    border-radius: 18px;
  }

  .my-header,
  .reservation-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .mini-hero h1 {
    font-size: 38px;
  }
}
</style>