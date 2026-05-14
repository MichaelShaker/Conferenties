<template>
  <main class="unsubscribe-view">
    <section class="unsubscribe-panel">
      <p class="eyebrow">Event-emails</p>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>

      <RouterLink to="/" class="home-link">
        Terug naar home
      </RouterLink>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { unsubscribeFromEventEmails } from '../services/api'

const route = useRoute()
const status = ref('loading')
const message = ref('')

const title = computed(() => {
  if (status.value === 'success') return 'Je bent afgemeld'
  if (status.value === 'error') return 'Afmelden is niet gelukt'
  return 'Afmelden wordt verwerkt'
})

const description = computed(() => {
  if (status.value === 'success') {
    return message.value || 'Je ontvangt geen automatische event-emails meer. Je account en registraties blijven gewoon bestaan.'
  }

  if (status.value === 'error') {
    return message.value || 'Deze link is ongeldig of verlopen. Log in en pas je profielinstellingen aan.'
  }

  return 'Een moment, we zetten je voorkeur om.'
})

onMounted(async () => {
  try {
    const token = route.query.token

    if (!token) {
      throw new Error('Er ontbreekt een afmeldtoken.')
    }

    const response = await unsubscribeFromEventEmails(token)

    status.value = 'success'
    message.value = response.message
  } catch (error) {
    status.value = 'error'
    message.value = error.message
  }
})
</script>

<style scoped>
.unsubscribe-view {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background: #f8fafc;
}

.unsubscribe-panel {
  width: min(620px, 100%);
  padding: 36px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
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
  margin-bottom: 12px;
  color: #0f172a;
  font-size: clamp(2rem, 6vw, 3.5rem);
  line-height: 0.95;
}

p {
  color: #64748b;
  line-height: 1.7;
}

.home-link {
  display: inline-flex;
  margin-top: 24px;
  padding: 12px 16px;
  border-radius: 8px;
  background: #2563eb;
  color: #ffffff;
  font-weight: 900;
  text-decoration: none;
}
</style>
