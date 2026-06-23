<template>
  <main class="maintenance-page">
    <div class="maintenance-backdrop" aria-hidden="true">
      <span class="float-item item-one"></span>
      <span class="float-item item-two"></span>
      <span class="float-item item-three"></span>
      <span class="scan-line"></span>
    </div>

    <section class="maintenance-popup" aria-labelledby="maintenance-title">
      <div class="popup-copy">
        <p class="eyebrow">Onderhoudsmodus</p>

        <h1 id="maintenance-title">{{ displaySettings.title }}</h1>

        <p class="maintenance-message">
          {{ displaySettings.message }}
        </p>

        <div v-if="displaySettings.expectedBackAt || displaySettings.contactEmail" class="maintenance-details">
          <div v-if="displaySettings.expectedBackAt">
            <span>Verwacht terug</span>
            <strong>{{ displaySettings.expectedBackAt }}</strong>
          </div>

          <div v-if="displaySettings.contactEmail">
            <span>Contact</span>
            <a :href="`mailto:${displaySettings.contactEmail}`">{{ displaySettings.contactEmail }}</a>
          </div>
        </div>

        <RouterLink to="/login" class="admin-link">
          Admin inloggen
        </RouterLink>
      </div>

      <div class="game-panel">
        <div class="game-header">
          <div>
            <span>Mini spel</span>
            <strong>Lichtlijn</strong>
          </div>

          <div class="score-board">
            <span>Score {{ score }}</span>
            <span>Beste {{ highScore }}</span>
          </div>
        </div>

        <div
          class="game-stage"
          :class="{ running: isRunning, crashed: gameOver }"
          role="application"
          tabindex="0"
          aria-label="Lichtlijn spel"
          @click="handleStageClick"
          @touchstart.passive="handleTouchStart"
          @touchend.passive="handleTouchEnd"
        >
          <div class="grid-board" aria-hidden="true">
            <span
              v-for="cell in cells"
              :key="cell.key"
              :class="cell.classes"
            ></span>
          </div>

          <span v-if="!isRunning && !gameOver" class="game-overlay">
            Start en stuur de lichtlijn naar de oranje energiepunten.
          </span>

          <span v-else-if="gameOver" class="game-overlay">
            Je route is gebotst. Probeer opnieuw.
          </span>
        </div>

        <div class="game-controls" aria-label="Spelbesturing">
          <button type="button" class="control up" @click="setDirection('up')">↑</button>
          <button type="button" class="control left" @click="setDirection('left')">←</button>
          <button type="button" class="control right" @click="setDirection('right')">→</button>
          <button type="button" class="control down" @click="setDirection('down')">↓</button>
        </div>

        <div class="game-actions">
          <button type="button" @click="startGame">
            {{ gameOver ? 'Opnieuw starten' : isRunning ? 'Herstart spel' : 'Start spel' }}
          </button>

          <p>Pijltjes, WASD of swipe om te sturen.</p>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  settings: {
    type: Object,
    required: true
  }
})

const boardSize = 12
const startTrail = [
  { x: 4, y: 6 },
  { x: 3, y: 6 },
  { x: 2, y: 6 }
]
const directionMap = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
}

const displaySettings = computed(() => ({
  title: props.settings.title || 'We zijn zo terug',
  message: props.settings.message || 'De website krijgt even onderhoud. Speel ondertussen een rondje mee.',
  expectedBackAt: props.settings.expectedBackAt || '',
  contactEmail: props.settings.contactEmail || ''
}))

const isRunning = ref(false)
const gameOver = ref(false)
const score = ref(0)
const highScore = ref(loadHighScore())
const trail = ref([...startTrail])
const target = ref({ x: 8, y: 6 })
const currentDirection = ref(directionMap.right)
const queuedDirection = ref(directionMap.right)
const touchStart = ref(null)

let moveTimer = null

const cells = computed(() => {
  return Array.from({ length: boardSize * boardSize }, (_, index) => {
    const x = index % boardSize
    const y = Math.floor(index / boardSize)
    const segmentIndex = trail.value.findIndex(segment => sameCell(segment, { x, y }))
    const isTarget = sameCell(target.value, { x, y })

    return {
      key: `${x}-${y}`,
      classes: [
        'grid-cell',
        segmentIndex === 0 ? 'head' : '',
        segmentIndex > 0 ? 'trail' : '',
        isTarget ? 'target' : ''
      ]
    }
  })
})

function loadHighScore() {
  try {
    return Number(window.localStorage.getItem('maintenanceLineHighScore') || 0)
  } catch (error) {
    return 0
  }
}

function saveHighScore() {
  if (score.value <= highScore.value) return

  highScore.value = score.value

  try {
    window.localStorage.setItem('maintenanceLineHighScore', String(highScore.value))
  } catch (error) {
    // Best score is a nice extra; the game keeps working if storage is blocked.
  }
}

function startGame() {
  window.clearInterval(moveTimer)

  score.value = 0
  gameOver.value = false
  isRunning.value = true
  trail.value = startTrail.map(segment => ({ ...segment }))
  target.value = { x: 8, y: 6 }
  currentDirection.value = directionMap.right
  queuedDirection.value = directionMap.right

  moveTimer = window.setInterval(moveLine, 170)
}

function handleStageClick() {
  if (!isRunning.value || gameOver.value) {
    startGame()
  }
}

function moveLine() {
  if (!isRunning.value || gameOver.value) return

  currentDirection.value = queuedDirection.value

  const head = trail.value[0]
  const nextHead = {
    x: head.x + currentDirection.value.x,
    y: head.y + currentDirection.value.y
  }
  const eatsTarget = sameCell(nextHead, target.value)
  const collisionTrail = eatsTarget ? trail.value : trail.value.slice(0, -1)

  if (isOutsideBoard(nextHead) || collisionTrail.some(segment => sameCell(segment, nextHead))) {
    endGame()
    return
  }

  const nextTrail = [nextHead, ...trail.value]

  if (eatsTarget) {
    score.value += 1
    saveHighScore()
    trail.value = nextTrail
    target.value = createTarget(nextTrail)
    return
  }

  trail.value = nextTrail.slice(0, trail.value.length)
}

function endGame() {
  gameOver.value = true
  isRunning.value = false
  saveHighScore()
  window.clearInterval(moveTimer)
}

function setDirection(directionName) {
  if (!isRunning.value) {
    startGame()
  }

  const nextDirection = directionMap[directionName]

  if (!nextDirection || isReverseDirection(nextDirection, currentDirection.value)) {
    return
  }

  queuedDirection.value = nextDirection
}

function handleKeydown(event) {
  const keys = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    Space: 'start'
  }
  const action = keys[event.code]

  if (!action) return

  event.preventDefault()

  if (action === 'start') {
    startGame()
    return
  }

  setDirection(action)
}

function handleTouchStart(event) {
  const touch = event.changedTouches[0]
  touchStart.value = {
    x: touch.clientX,
    y: touch.clientY
  }
}

function handleTouchEnd(event) {
  if (!touchStart.value) return

  const touch = event.changedTouches[0]
  const deltaX = touch.clientX - touchStart.value.x
  const deltaY = touch.clientY - touchStart.value.y
  touchStart.value = null

  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 24) {
    startGame()
    return
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    setDirection(deltaX > 0 ? 'right' : 'left')
    return
  }

  setDirection(deltaY > 0 ? 'down' : 'up')
}

function createTarget(occupiedCells) {
  const freeCells = []

  for (let y = 0; y < boardSize; y += 1) {
    for (let x = 0; x < boardSize; x += 1) {
      if (!occupiedCells.some(segment => sameCell(segment, { x, y }))) {
        freeCells.push({ x, y })
      }
    }
  }

  if (!freeCells.length) {
    endGame()
    return target.value
  }

  return freeCells[Math.floor(Math.random() * freeCells.length)]
}

function sameCell(first, second) {
  return first.x === second.x && first.y === second.y
}

function isOutsideBoard(cell) {
  return cell.x < 0 || cell.y < 0 || cell.x >= boardSize || cell.y >= boardSize
}

function isReverseDirection(nextDirection, activeDirection) {
  return nextDirection.x + activeDirection.x === 0
    && nextDirection.y + activeDirection.y === 0
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.clearInterval(moveTimer)
})
</script>

<style scoped>
.maintenance-page {
  min-height: 100vh;
  position: relative;
  display: grid;
  place-items: center;
  padding: 32px;
  overflow: hidden;
  background:
      linear-gradient(120deg, rgba(8, 13, 28, 0.92), rgba(31, 41, 78, 0.76)),
      url('../assets/home.png') center / cover;
}

.maintenance-backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.maintenance-backdrop::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
      linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
      linear-gradient(0deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: linear-gradient(to bottom, transparent, black 20%, black 72%, transparent);
}

.float-item {
  position: absolute;
  width: 88px;
  height: 88px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 30px rgba(255, 255, 255, 0.08);
  animation: drift 9s ease-in-out infinite;
}

.item-one {
  left: 10%;
  top: 14%;
}

.item-two {
  right: 12%;
  top: 18%;
  width: 54px;
  height: 54px;
  animation-delay: -2s;
}

.item-three {
  right: 18%;
  bottom: 13%;
  width: 120px;
  height: 120px;
  animation-delay: -4s;
}

.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  top: -12%;
  height: 120px;
  background: linear-gradient(to bottom, transparent, rgba(125, 211, 252, 0.16), transparent);
  animation: scan 7s linear infinite;
}

.maintenance-popup {
  position: relative;
  z-index: 2;
  width: min(1120px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(360px, 0.75fr);
  gap: 22px;
  padding: 22px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  background: rgba(13, 19, 38, 0.72);
  color: #ffffff;
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.36);
  backdrop-filter: blur(22px);
  animation: pop-in 0.55s cubic-bezier(.2, .9, .2, 1);
}

.popup-copy,
.game-panel {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
}

.popup-copy {
  padding: clamp(24px, 4vw, 42px);
}

.eyebrow {
  margin-bottom: 12px;
  color: #7dd3fc;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1 {
  max-width: 620px;
  margin-bottom: 16px;
  font-size: clamp(2.8rem, 6vw, 5.4rem);
  line-height: 0.94;
  letter-spacing: 0;
}

.maintenance-message {
  max-width: 620px;
  color: #dbeafe;
  font-size: 1.1rem;
  line-height: 1.8;
  white-space: pre-wrap;
}

.maintenance-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 24px;
}

.maintenance-details div {
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
}

.maintenance-details span {
  display: block;
  margin-bottom: 6px;
  color: #bfdbfe;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.maintenance-details strong,
.maintenance-details a {
  color: #ffffff;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.admin-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  margin-top: 26px;
  padding: 0 18px;
  border-radius: 8px;
  background: #ffffff;
  color: #1d4ed8;
  font-weight: 900;
}

.game-panel {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.game-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.game-header span,
.score-board span {
  display: block;
  color: #bfdbfe;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.game-header strong {
  display: block;
  margin-top: 5px;
  font-size: 1.2rem;
}

.score-board {
  flex: 0 0 auto;
  display: grid;
  gap: 4px;
  text-align: right;
}

.game-stage {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  background:
      linear-gradient(to bottom, rgba(14, 165, 233, 0.2), rgba(15, 23, 42, 0.08)),
      linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02));
  cursor: pointer;
  outline: none;
  touch-action: manipulation;
}

.game-stage:focus-visible {
  box-shadow: 0 0 0 4px rgba(125, 211, 252, 0.32);
}

.grid-board {
  position: absolute;
  inset: 12px;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: repeat(12, minmax(0, 1fr));
  gap: 4px;
}

.grid-cell {
  min-width: 0;
  min-height: 0;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.045);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.035);
}

.grid-cell.trail,
.grid-cell.head {
  background: #ffffff;
  box-shadow: 0 0 18px rgba(255, 255, 255, 0.3);
}

.grid-cell.head {
  background: #7dd3fc;
  box-shadow: 0 0 26px rgba(125, 211, 252, 0.65);
}

.grid-cell.target {
  background: #fb923c;
  box-shadow: 0 0 24px rgba(251, 146, 60, 0.78);
  animation: pulse-target 0.85s ease-in-out infinite alternate;
}

.game-overlay {
  position: absolute;
  inset: 12px;
  display: grid;
  place-items: center;
  padding: 24px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.62);
  color: #ffffff;
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.35;
  text-align: center;
}

.game-controls {
  display: grid;
  grid-template-columns: repeat(3, 44px);
  grid-template-rows: repeat(2, 42px);
  justify-content: center;
  gap: 8px;
}

.control {
  min-width: 44px;
  min-height: 42px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 900;
  transition: background 0.16s ease, transform 0.16s ease;
}

.control:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.control.up {
  grid-column: 2;
}

.control.left {
  grid-column: 1;
  grid-row: 2;
}

.control.right {
  grid-column: 3;
  grid-row: 2;
}

.control.down {
  grid-column: 2;
  grid-row: 2;
}

.game-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.game-actions button {
  flex: 0 0 auto;
  min-height: 44px;
  padding: 0 15px;
  border-radius: 8px;
  background: #ffffff;
  color: #1d4ed8;
  font-weight: 900;
}

.game-actions p {
  margin: 0;
  color: #cbd5e1;
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: right;
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes drift {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-22px) rotate(8deg);
  }
}

@keyframes scan {
  from {
    transform: translateY(-20vh);
  }

  to {
    transform: translateY(120vh);
  }
}

@keyframes pulse-target {
  from {
    transform: scale(0.82);
  }

  to {
    transform: scale(1);
  }
}

@media (max-width: 920px) {
  .maintenance-popup {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .maintenance-page {
    padding: 14px;
  }

  .maintenance-popup {
    padding: 12px;
    border-radius: 8px;
  }

  .popup-copy,
  .game-panel {
    padding: 18px;
  }

  h1 {
    font-size: 2.55rem;
    letter-spacing: 0;
  }

  .game-header,
  .game-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .score-board,
  .game-actions p {
    text-align: left;
  }

  .game-actions button {
    width: 100%;
  }

  .grid-board {
    inset: 10px;
    gap: 3px;
  }
}
</style>
