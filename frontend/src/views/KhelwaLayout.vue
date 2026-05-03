<template>
  <div class="khelwa-layout">
    <KhelwaHeader :isHome="isHome" />

    <!-- HERO ONLY ON HOMEPAGE -->
    <section v-if="isHome" class="khelwa-hero">
      <video class="hero-video" autoplay muted loop playsinline>
        <source :src="heroVideo" type="video/mp4" />
      </video>

      <div class="hero-overlay"></div>

      <div class="hero-content">
        <h1>Een moment van stilte</h1>
        <p>
          Een rustige plek voor gebed, bezinning en geestelijke verdieping.
        </p>

        <RouterLink to="/khelwa" class="hero-btn">
          Reserveer jouw plek
        </RouterLink>
      </div>
    </section>

    <!-- CONTENT -->
    <main :class="['khelwa-content', { noHero: !isHome }]">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from "vue"
import { useRoute } from "vue-router"
import KhelwaHeader from "../components/KhelwaHeader.vue"
import heroVideo from "../assets/data1.mp4"

const route = useRoute()

const isHome = computed(() => route.path === "/khelwa")
</script>

<style scoped>
.khelwa-layout {
  min-height: 100vh;
  background:
      radial-gradient(circle at top left, rgba(188, 151, 112, 0.22), transparent 35%),
      linear-gradient(180deg, #f8f3ed 0%, #f4eee6 100%);
}

/* HERO */
.khelwa-hero {
  position: relative;
  height: 70vh;
  min-height: 520px;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: #231914;
}

.hero-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
      linear-gradient(90deg, rgba(34, 23, 16, 0.8), rgba(34, 23, 16, 0.3));
}

.hero-content {
  position: relative;
  width: min(1180px, 92%);
  margin: 0 auto;
  color: white;
  z-index: 2;
}

.hero-content h1 {
  font-size: clamp(48px, 6vw, 80px);
  font-weight: 950;
  margin: 0;
}

.hero-btn {
  display: inline-block;
  margin-top: 24px;
  padding: 14px 24px;
  background: #3a271d;
  border-radius: 999px;
  font-weight: 900;
  text-decoration: none;
}

/* CONTENT */
.khelwa-content {
  position: relative;
  z-index: 3;
  margin-top: -100px;
  width: min(1180px, 92%);
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 60px;
}

/* NO HERO PAGES */
.khelwa-content.noHero {
  margin-top: 40px;
}
</style>