<template>
  <article class="event-card">
    <RouterLink :to="`/events/${event.id}`" class="event-card__image-area">
      <img
          class="event-card__image"
          :src="event.image"
          :alt="event.title"
      />

      <div class="event-card__date-pill">
        <span>{{ dayRange }}</span>
        <strong>{{ month }}</strong>
      </div>

      <span class="event-card__category">
        {{ event.category }}
      </span>
    </RouterLink>

    <div class="event-card__content">
      <div class="event-card__header">
        <h3 class="event-card__title">
          {{ event.title }}
        </h3>

        <span class="event-card__price">
          {{ priceLabel }}
        </span>
      </div>

      <p class="event-card__description">
        {{ shortDescription }}
      </p>

      <div class="event-card__info">
        <span>{{ formattedDate }}</span>
        <span>{{ event.location }}</span>
        <span v-if="isAdmin">{{ event.registeredCount || 0 }} / {{ event.capacity }} plekken bezet</span>
      </div>

      <RouterLink :to="`/events/${event.id}`" class="event-card__button">
        Bekijk event
        <span>→</span>
      </RouterLink>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { authState } from '../stores/auth'

const props = defineProps({
  event: {
    type: Object,
    required: true
  }
})

const eventDate = computed(() => {
  const value = props.event.date || props.event.conference_date || props.event.eventDate

  if (!value) return null

  return new Date(value)
})

const eventEndDate = computed(() => {
  const value = props.event.dateEnd || props.event.event_end_date || props.event.eventDateEnd

  if (!value) return null

  return new Date(value)
})

const dayRange = computed(() => {
  if (!eventDate.value) return ''
  const startDay = eventDate.value.toLocaleDateString('nl-NL', { day: '2-digit' })

  if (!eventEndDate.value || isSameDate(eventDate.value, eventEndDate.value)) {
    return startDay
  }

  const endDay = eventEndDate.value.toLocaleDateString('nl-NL', { day: '2-digit' })
  return `${startDay}-${endDay}`
})

const month = computed(() => {
  if (!eventDate.value) return ''
  const displayDate = eventEndDate.value && !isSameDate(eventDate.value, eventEndDate.value)
      ? eventEndDate.value
      : eventDate.value

  return displayDate.toLocaleDateString('nl-NL', {
    month: 'short'
  })
})

const formattedDate = computed(() => {
  if (!eventDate.value) return ''

  const start = eventDate.value.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  if (!eventEndDate.value || isSameDate(eventDate.value, eventEndDate.value)) {
    return start
  }

  const end = eventEndDate.value.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  return `${start} t/m ${end}`
})

const isAdmin = computed(() => authState.user?.role === 'admin')

const canChoosePartialDays = computed(() => {
  return Number(props.event.maxEventDays || 1) > 1
      && (props.event.allowPartialDays === true || props.event.allowPartialDays === 1)
})

const priceLabel = computed(() => {
  const prefix = canChoosePartialDays.value ? 'vanaf ' : ''
  const price = canChoosePartialDays.value
      ? props.event.priceOneDay ?? props.event.price ?? 0
      : props.event.price ?? props.event.priceOneDay ?? 0

  return `${prefix}€${Number(price).toFixed(2)}`
})

function isSameDate(first, second) {
  return first.toISOString().slice(0, 10) === second.toISOString().slice(0, 10)
}

const shortDescription = computed(() => {
  if (!props.event.description) return ''

  return props.event.description.length > 90
      ? props.event.description.slice(0, 90) + '...'
      : props.event.description
})
</script>

<style scoped>
.event-card {
  position: relative;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
  transition: 0.25s ease;
}

.event-card::before {
  content: none;
}

.event-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 22px 52px rgba(15, 23, 42, 0.12);
}

.event-card__image-area {
  position: relative;
  display: block;
  height: 230px;
  overflow: hidden;
  background: #f1f5f9;
}

.event-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: 0.45s ease;
}

.event-card:hover .event-card__image {
  transform: scale(1.06);
}

.event-card__image-area::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
      linear-gradient(to bottom, rgba(15, 23, 42, 0.25), transparent 45%),
      linear-gradient(to top, rgba(15, 23, 42, 0.45), transparent 55%);
}

.event-card__date-pill {
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 3;
  width: 64px;
  height: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.94);
  color: #0f172a;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(10px);
}

.event-card__date-pill span {
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1;
}

.event-card__date-pill strong {
  margin-top: 4px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #2563eb;
}

.event-card__category {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 3;
  padding: 8px 13px;
  border-radius: 10px;
  background: #0f172a;
  color: white;
  font-size: 0.78rem;
  font-weight: 800;
}

.event-card__content {
  position: relative;
  z-index: 4;
  padding: 24px;
}

.event-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.event-card__title {
  color: #0f172a;
  font-size: 1.25rem;
  line-height: 1.25;
  letter-spacing: -0.04em;
}

.event-card__price {
  flex-shrink: 0;
  padding: 8px 11px;
  border-radius: 10px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.9rem;
  font-weight: 900;
}

.event-card__description {
  margin-bottom: 18px;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.7;
}

.event-card__info {
  display: grid;
  gap: 8px;
  margin-bottom: 20px;
  color: #475569;
  font-size: 0.9rem;
  font-weight: 700;
}

.event-card__info span {
  display: block;
  padding: 9px 11px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.event-card__button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
  padding: 14px 17px;
  min-height: 48px;
  border-radius: 10px;
  background: #0f172a;
  color: #ffffff;
  font-weight: 900;
  text-decoration: none;
  transition: 0.2s ease;
}

.event-card__button:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.event-card__button span {
  font-size: 1.2rem;
}

@media (max-width: 640px) {
  .event-card__image-area {
    height: 205px;
  }

  .event-card__content {
    padding: 18px;
  }

  .event-card__header {
    flex-direction: column;
    gap: 10px;
  }

  .event-card__price {
    width: 100%;
    text-align: center;
  }
}
</style>
