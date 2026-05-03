<template>
  <section class="booking-page">
    <div class="intro-card">
      <span class="badge">Khelwa reservering</span>
      <h2>Plan jouw moment van stilte</h2>
      <p>
        Kies een beschikbare dag en verstuur je aanvraag. Je naam, e-mailadres
        en telefoonnummer worden automatisch uit je account gehaald.
      </p>
    </div>

    <div class="content-grid">
      <div class="calendar-card">
        <div class="calendar-top">
          <button type="button" @click="previousMonth">‹</button>
          <h3>{{ monthLabel }}</h3>
          <button type="button" @click="nextMonth">›</button>
        </div>

        <div class="weekdays">
          <span>Ma</span>
          <span>Di</span>
          <span>Wo</span>
          <span>Do</span>
          <span>Vr</span>
          <span>Za</span>
          <span>Zo</span>
        </div>

        <div class="calendar-grid">
          <div
              v-for="empty in emptyDays"
              :key="'empty-' + empty"
              class="day empty"
          ></div>

          <button
              v-for="day in availability"
              :key="day.date"
              type="button"
              class="day"
              :class="{
              selected: isDateSelected(day.date),
              range: isDateInSelectedRange(day.date),
              unavailable: !day.available
            }"
              :disabled="!day.available"
              @click="selectDate(day.date)"
          >
            <strong>{{ getDayNumber(day.date) }}</strong>
            <small v-if="day.available">{{ day.available_spots }} plekken</small>
            <small v-else>Vol / dicht</small>
          </button>
        </div>
      </div>

      <form class="form-card" @submit.prevent="submitReservation">
        <h3>Reserveringsaanvraag</h3>

        <div class="account-note">
          <strong>Accountgegevens worden automatisch gebruikt</strong>
          <p>
            De reservering wordt gekoppeld aan je ingelogde account.
          </p>
        </div>

        <div class="two-columns">
          <label>
            Type reservering
            <select v-model="form.reservation_type">
              <option value="single">Alleen</option>
              <option value="group">Groep</option>
            </select>
          </label>

          <label>
            Verblijf
            <select v-model="form.stay_type">
              <option value="day">Dagbezoek</option>
              <option value="overnight">Overnachten</option>
            </select>
          </label>
        </div>

        <div class="two-columns">
          <label>
            Startdatum
            <input v-model="form.start_date" type="date" required />
          </label>

          <label v-if="form.stay_type === 'overnight'">
            Retourdatum
            <input v-model="form.end_date" type="date" required />
          </label>
        </div>

        <label>
          Aantal personen
          <input
              v-model.number="form.group_size"
              type="number"
              min="1"
              required
          />
        </label>

        <button class="submit-btn" type="submit" :disabled="loading">
          {{ loading ? "Versturen..." : "Reservering aanvragen" }}
        </button>

        <p v-if="message" class="message" :class="{ error: isError }">
          {{ message }}
        </p>
      </form>
    </div>
  </section>
</template>

<script>
import {
  getKhelwaAvailability,
  createKhelwaReservation
} from "../services/khelwaApi"

export default {
  name: "KhelwaBookingView",

  data() {
    const today = new Date()

    return {
      currentDate: new Date(today.getFullYear(), today.getMonth(), 1),
      availability: [],
      loading: false,
      message: "",
      isError: false,
      form: {
        reservation_type: "single",
        stay_type: "day",
        start_date: "",
        end_date: "",
        group_size: 1
      }
    }
  },

  computed: {
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

  watch: {
    "form.stay_type"(value) {
      this.message = ""
      this.isError = false

      if (value === "day") {
        this.form.end_date = this.form.start_date
      }

      if (value === "overnight") {
        this.form.end_date = ""
      }
    },

    "form.start_date"(value) {
      if (this.form.stay_type === "day") {
        this.form.end_date = value
      }
    }
  },

  mounted() {
    this.loadAvailability()
  },

  methods: {
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

      this.resetSelectedDates()
      this.loadAvailability()
    },

    nextMonth() {
      this.currentDate = new Date(
          this.currentDate.getFullYear(),
          this.currentDate.getMonth() + 1,
          1
      )

      this.resetSelectedDates()
      this.loadAvailability()
    },

    getDayNumber(date) {
      return Number(date.split("-")[2])
    },

    selectDate(date) {
      this.message = ""
      this.isError = false

      if (this.form.stay_type === "day") {
        this.form.start_date = date
        this.form.end_date = date
        return
      }

      if (!this.form.start_date || this.form.end_date) {
        this.form.start_date = date
        this.form.end_date = ""
        return
      }

      if (new Date(date) < new Date(this.form.start_date)) {
        this.form.end_date = this.form.start_date
        this.form.start_date = date
      } else {
        this.form.end_date = date
      }

      if (this.selectedRangeHasUnavailableDates()) {
        this.isError = true
        this.message = "Je selectie bevat een dag die vol of gesloten is."
        this.form.end_date = ""
      }
    },

    isDateSelected(date) {
      if (!this.form.start_date) return false

      if (this.form.stay_type === "day") {
        return this.form.start_date === date
      }

      if (!this.form.end_date) {
        return this.form.start_date === date
      }

      const current = new Date(date)
      const start = new Date(this.form.start_date)
      const end = new Date(this.form.end_date)

      return current >= start && current <= end
    },

    isDateInSelectedRange(date) {
      return this.isDateSelected(date)
    },

    selectedRangeHasUnavailableDates() {
      if (!this.form.start_date || !this.form.end_date) return false

      const start = new Date(this.form.start_date)
      const end = new Date(this.form.end_date)

      return this.availability.some(day => {
        const current = new Date(day.date)
        return current >= start && current <= end && !day.available
      })
    },

    resetSelectedDates() {
      this.form.start_date = ""
      this.form.end_date = ""
    },

    resetForm() {
      this.form = {
        reservation_type: "single",
        stay_type: "day",
        start_date: "",
        end_date: "",
        group_size: 1
      }
    },

    async submitReservation() {
      this.loading = true
      this.message = ""
      this.isError = false

      if (!this.form.start_date) {
        this.loading = false
        this.isError = true
        this.message = "Kies eerst een startdatum."
        return
      }

      if (this.form.stay_type === "day") {
        this.form.end_date = this.form.start_date
      }

      if (this.form.stay_type === "overnight" && !this.form.end_date) {
        this.loading = false
        this.isError = true
        this.message = "Kies ook een retourdatum."
        return
      }

      if (new Date(this.form.end_date) < new Date(this.form.start_date)) {
        this.loading = false
        this.isError = true
        this.message = "Retourdatum mag niet vóór de startdatum liggen."
        return
      }

      if (this.selectedRangeHasUnavailableDates()) {
        this.loading = false
        this.isError = true
        this.message = "Je selectie bevat een dag die vol of gesloten is."
        return
      }

      const result = await createKhelwaReservation(this.form)

      if (result.success) {
        this.message =
            "Je reservering is aangevraagd. Je krijgt bericht na goedkeuring."
        this.resetForm()
        await this.loadAvailability()
      } else {
        this.isError = true
        this.message = result.message || "Er ging iets fout."
      }

      this.loading = false
    }
  }
}
</script>

<style scoped>
.booking-page {
  --ink: #2f2418;
  --coptic-red: #8f2f24;
  --gold: #c99a3e;
  --gold-soft: rgba(201, 154, 62, 0.18);
  --cream: #fbf3e5;
  --paper: #fffaf1;
  --line: rgba(143, 47, 36, 0.18);

  display: flex;
  flex-direction: column;
  gap: 28px;
  animation: pageIn 0.6s ease both;
}

.intro-card,
.calendar-card,
.form-card {
  position: relative;
  background:
      linear-gradient(180deg, rgba(255,250,241,0.98), rgba(251,243,229,0.94)),
      radial-gradient(circle at top right, rgba(201,154,62,0.16), transparent 36%);
  border: 1px solid rgba(201,154,62,0.35);
  border-radius: 28px;
  box-shadow:
      0 24px 60px rgba(47, 36, 24, 0.11),
      inset 0 1px 0 rgba(255,255,255,0.85);
  overflow: hidden;
}

.intro-card {
  padding: 46px;
}

.calendar-card,
.form-card {
  padding: 34px;
}

.intro-card::before,
.calendar-card::before,
.form-card::before {
  content: "✣";
  position: absolute;
  right: 28px;
  top: 22px;
  color: rgba(201,154,62,0.24);
  font-size: 76px;
  line-height: 1;
  pointer-events: none;
}

.intro-card::after {
  content: "";
  position: absolute;
  inset: 14px;
  border: 1px solid rgba(201,154,62,0.28);
  border-radius: 22px;
  pointer-events: none;
}

.badge {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  color: var(--coptic-red);
  font-size: 12px;
  font-weight: 800;
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

.intro-card h2 {
  position: relative;
  z-index: 1;
  margin: 0;
  max-width: 780px;
  color: var(--ink);
  font-size: clamp(34px, 4.5vw, 56px);
  line-height: 1.05;
  letter-spacing: -0.04em;
  font-weight: 900;
}

.intro-card p {
  position: relative;
  z-index: 1;
  max-width: 760px;
  margin: 20px 0 0;
  color: rgba(47, 36, 24, 0.68);
  font-size: 16px;
  line-height: 1.85;
  font-weight: 600;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(360px, 0.88fr);
  gap: 28px;
  align-items: start;
}

.calendar-card {
  min-height: 620px;
}

.calendar-top {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 52px 1fr 52px;
  align-items: center;
  gap: 18px;
  margin-bottom: 28px;
}

.calendar-top h3 {
  margin: 0;
  text-align: center;
  color: var(--ink);
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.03em;
  text-transform: capitalize;
}

.calendar-top button {
  width: 52px;
  height: 52px;
  border: 1px solid rgba(201,154,62,0.42);
  color: var(--coptic-red);
  background:
      linear-gradient(180deg, #fffaf1, #f5e5c9);
  border-radius: 50%;
  font-size: 28px;
  cursor: pointer;
  transition: 0.18s ease;
  box-shadow: 0 10px 22px rgba(47,36,24,0.1);
}

.calendar-top button:hover {
  transform: translateY(-2px);
  border-color: var(--gold);
  box-shadow: 0 14px 26px rgba(47,36,24,0.14);
}

.weekdays,
.calendar-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
}

.weekdays {
  margin-bottom: 12px;
}

.weekdays span {
  text-align: center;
  color: rgba(47, 36, 24, 0.48);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.day {
  min-height: 86px;
  border: 1px solid rgba(201,154,62,0.28);
  background:
      linear-gradient(180deg, rgba(255,250,241,0.96), rgba(251,243,229,0.78));
  color: var(--ink);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  transition: 0.18s ease;
}

.day::before {
  content: "✣";
  position: absolute;
  right: 8px;
  top: 6px;
  color: rgba(201,154,62,0.18);
  font-size: 18px;
}

.day:hover:not(:disabled):not(.empty) {
  transform: translateY(-3px);
  border-color: rgba(201,154,62,0.7);
  box-shadow: 0 14px 28px rgba(47,36,24,0.12);
}

.day strong {
  position: relative;
  z-index: 1;
  font-size: 23px;
  font-weight: 900;
}

.day small {
  position: relative;
  z-index: 1;
  color: rgba(47,36,24,0.58);
  font-size: 12px;
  font-weight: 750;
}

.day.selected,
.day.range {
  color: #fffaf1;
  background:
      linear-gradient(135deg, #8f2f24, #5b241d),
      radial-gradient(circle at top right, rgba(201,154,62,0.45), transparent 45%);
  border-color: rgba(201,154,62,0.7);
  box-shadow: 0 16px 34px rgba(143,47,36,0.24);
}

.day.selected small,
.day.range small {
  color: rgba(255,250,241,0.82);
}

.day.unavailable {
  cursor: not-allowed;
  color: rgba(47,36,24,0.3);
  background: rgba(47,36,24,0.045);
  box-shadow: none;
}

.day.unavailable small {
  color: rgba(47,36,24,0.32);
}

.empty {
  background: transparent;
  border: 0;
  pointer-events: none;
}

.form-card {
  position: sticky;
  top: 24px;
}

.form-card h3 {
  position: relative;
  z-index: 1;
  margin: 0 0 20px;
  color: var(--ink);
  font-size: 26px;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.account-note {
  position: relative;
  z-index: 1;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255,250,241,0.76);
  border: 1px solid rgba(201,154,62,0.28);
  color: #4a3a30;
  border-radius: 18px;
}

.account-note strong {
  display: block;
  color: var(--ink);
  font-weight: 850;
  margin-bottom: 6px;
}

.account-note p {
  margin: 0;
  color: rgba(47,36,24,0.64);
  font-weight: 600;
  line-height: 1.5;
}

label {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-bottom: 17px;
  color: rgba(47,36,24,0.72);
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.04em;
}

input,
select {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(201,154,62,0.34);
  background: rgba(255,250,241,0.86);
  color: var(--ink);
  padding: 15px 16px;
  font-size: 15px;
  font-weight: 650;
  outline: none;
  border-radius: 16px;
  transition: 0.18s ease;
}

input:focus,
select:focus {
  background: white;
  border-color: var(--gold);
  box-shadow: 0 0 0 4px rgba(201,154,62,0.15);
}

.two-columns {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.submit-btn {
  position: relative;
  z-index: 1;
  width: 100%;
  border: 0;
  margin-top: 8px;
  padding: 17px 18px;
  color: #fffaf1;
  background:
      linear-gradient(135deg, #8f2f24, #5b241d);
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
  border-radius: 18px;
  box-shadow: 0 18px 34px rgba(143,47,36,0.22);
  transition: 0.18s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 22px 38px rgba(143,47,36,0.28);
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.message {
  position: relative;
  z-index: 1;
  margin-top: 18px;
  padding: 14px 16px;
  background: rgba(232,245,233,0.9);
  color: #256029;
  font-weight: 750;
  line-height: 1.5;
  border-radius: 16px;
}

.message.error {
  background: rgba(253,236,234,0.95);
  color: #9b1c1c;
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

@media (max-width: 980px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .form-card {
    position: static;
  }
}

@media (max-width: 620px) {
  .intro-card,
  .calendar-card,
  .form-card {
    padding: 24px;
    border-radius: 22px;
  }

  .intro-card h2 {
    font-size: 34px;
  }

  .calendar-top {
    grid-template-columns: 46px 1fr 46px;
  }

  .calendar-top button {
    width: 46px;
    height: 46px;
  }

  .weekdays,
  .calendar-grid {
    gap: 6px;
  }

  .day {
    min-height: 62px;
    border-radius: 14px;
  }

  .day strong {
    font-size: 18px;
  }

  .day small {
    display: none;
  }

  .two-columns {
    grid-template-columns: 1fr;
  }
}
</style>