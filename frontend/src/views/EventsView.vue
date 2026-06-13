<template>
  <main class="events-view">

    <!-- HERO -->
    <section class="events-hero">
      <div class="events-hero__content">
        <p class="events-hero__eyebrow">Conferenties</p>

        <h1>Kies rustig waar je bij wilt zijn.</h1>

        <p>
          Alle conferenties op een plek, met duidelijke data, prijzen en aanmeldstappen.
        </p>
      </div>

      <div class="events-hero__counter">
        <strong>{{ filteredEvents.length }}</strong>
        <span>events gevonden</span>
      </div>
    </section>

    <StatusMessage :message="message" :success="success" />

    <!-- FILTERS -->
    <section class="filters-panel">
      <div class="search-field">
        <label for="search">Zoeken</label>

        <input
            id="search"
            v-model="searchTerm"
            type="text"
            placeholder="Zoek op titel..."
        />
      </div>

      <div class="category-chips">
        <button
            :class="{ active: categoryFilter === '' }"
            @click="categoryFilter = ''"
        >
          Alles
        </button>

        <button
            v-for="category in categories"
            :key="category"
            :class="{ active: categoryFilter === category }"
            @click="categoryFilter = category"
        >
          {{ category }}
        </button>
      </div>
    </section>

    <!-- CONTENT -->
    <section v-if="loading" class="state-box">
      <span>✦</span>
      <h2>Events worden geladen...</h2>
      <p>Even geduld, we halen de nieuwste events op.</p>
    </section>

    <section v-else-if="filteredEvents.length" class="events-layout">
      <EventCard
          v-for="event in filteredEvents"
          :key="event.id"
          :event="event"
      />
    </section>

    <section v-else class="state-box">
      <span>⌕</span>
      <h2>Geen events gevonden</h2>
      <p>Probeer een andere zoekterm of kies een andere categorie.</p>
    </section>

  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import StatusMessage from '../components/StatusMessage.vue'
import EventCard from '../components/EventCard.vue'
import { fetchConferences } from '../services/api'

const loading = ref(false)
const message = ref('')
const success = ref(false)
const searchTerm = ref('')
const categoryFilter = ref('')
const events = ref([])

const categories = computed(() => {
  return [...new Set(events.value.map(event => event.category))].filter(Boolean)
})

const filteredEvents = computed(() => {
  return events.value.filter(event => {
    const title = event.title?.toLowerCase() || ''
    const search = searchTerm.value.toLowerCase()

    const matchesSearch = title.includes(search)
    const matchesCategory = !categoryFilter.value || event.category === categoryFilter.value

    return matchesSearch && matchesCategory
  })
})

onMounted(async () => {
  loading.value = true

  try {
    events.value = await fetchConferences()
    success.value = true
  } catch (error) {
    success.value = false
    message.value = 'Backend error: ' + error.message
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.events-view {
  width: 100%;
  min-height: 100vh;
  padding: 0 0 72px;
  background: #f7f4ee;
}

/* HERO */
.events-hero {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 32px;
  min-height: 430px;
  margin-bottom: 0;
  padding: 118px max(4vw, 30px) 72px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  background:
      linear-gradient(90deg, rgba(9, 17, 34, 0.92), rgba(9, 17, 34, 0.54) 52%, rgba(9, 17, 34, 0.38)),
      linear-gradient(0deg, rgba(9, 17, 34, 0.68), rgba(9, 17, 34, 0.18)),
      url('../assets/home.png') center / cover;
}

.events-hero__content {
  position: relative;
  z-index: 2;
  width: min(760px, 100%);
}

.events-hero__eyebrow {
  margin-bottom: 14px;
  color: #7dd3fc;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.events-hero h1 {
  max-width: 780px;
  margin-bottom: 18px;
  color: #ffffff;
  font-size: clamp(3rem, 6vw, 5.4rem);
  line-height: 0.94;
  letter-spacing: -0.075em;
}

.events-hero p {
  max-width: 620px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 1.05rem;
  line-height: 1.8;
}

.events-hero__counter {
  position: relative;
  z-index: 2;
  width: 150px;
  height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.72);
  color: white;
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.22);
  backdrop-filter: blur(14px);
}

.events-hero__counter strong {
  font-size: 3.2rem;
  line-height: 1;
  letter-spacing: -0.08em;
}

.events-hero__counter span {
  margin-top: 8px;
  color: #cbd5e1;
  font-size: 0.9rem;
  text-align: center;
}

/* FILTERS */
.filters-panel {
  width: min(1280px, calc(100% - 56px));
  display: grid;
  grid-template-columns: minmax(260px, 420px) minmax(0, 1fr);
  align-items: end;
  gap: 22px;
  margin: -34px auto 42px;
  padding: 22px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(14px);
  position: relative;
  z-index: 5;
}

.search-field label {
  display: block;
  margin-bottom: 9px;
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 900;
}

.search-field input {
  width: 100%;
  min-height: 52px;
  padding: 0 18px;
  border: 1px solid #dbe4f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #0f172a;
  outline: none;
  transition: 0.2s ease;
}

.search-field input:focus {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.category-chips {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.category-chips button {
  min-height: 44px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.88rem;
  font-weight: 900;
  transition: 0.2s ease;
}

.category-chips button:hover {
  background: #dbeafe;
  color: #2563eb;
}

.category-chips button.active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.24);
}

/* EVENTS */
.events-layout {
  width: min(1280px, calc(100% - 56px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 26px;
  align-items: stretch;
}

/* STATES */
.state-box {
  width: min(1280px, calc(100% - 56px));
  margin: 0 auto;
  padding: 70px 28px;
  text-align: center;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background:
      radial-gradient(circle at top, rgba(37, 99, 235, 0.09), transparent 34%),
      #ffffff;
  box-shadow: 0 16px 45px rgba(15, 23, 42, 0.06);
}

.state-box span {
  display: block;
  margin-bottom: 16px;
  color: #2563eb;
  font-size: 2rem;
}

.state-box h2 {
  margin-bottom: 10px;
  color: #0f172a;
  font-size: 1.8rem;
  letter-spacing: -0.04em;
}

.state-box p {
  color: #64748b;
}

/* RESPONSIVE */
@media (max-width: 1050px) {
  .events-layout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 850px) {
  .events-hero {
    grid-template-columns: 1fr;
    padding: 42px 30px;
  }

  .events-hero__counter {
    width: 100%;
    height: auto;
    min-height: 88px;
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
    padding: 18px;
  }

  .filters-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .events-view {
    padding-bottom: 48px;
  }

  .events-hero {
    min-height: 390px;
    padding: 96px 20px 58px;
  }

  .events-hero h1 {
    font-size: 2.55rem;
    letter-spacing: -0.05em;
  }

  .events-layout {
    grid-template-columns: 1fr;
  }

  .filters-panel {
    width: calc(100% - 28px);
    margin-top: -24px;
    border-radius: 12px;
    padding: 16px;
  }

  .events-layout,
  .state-box {
    width: calc(100% - 28px);
  }
}
</style>
