import { reducedMotion, scramble } from './util.js'
import { initAmbient } from './ambient.js'

// ─── Name: split into letters for the staggered rise ──────────────────────────

function splitName() {
  let i = 0
  document.querySelectorAll('.hero-word').forEach((word) => {
    const letters = [...word.textContent.trim()]
    word.textContent = ''
    letters.forEach((ch) => {
      const span = document.createElement('span')
      span.className = 'hero-char'
      span.textContent = ch
      span.style.setProperty('--i', i++)
      word.appendChild(span)
    })
  })
}

// ─── Local clock (Gainesville time) ───────────────────────────────────────────

function initClock() {
  const el = document.getElementById('local-time')
  if (!el) return
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
  const update = () => { el.textContent = fmt.format(new Date()) }
  update()
  setInterval(update, 15_000)
}

// ─── "currently" — cycles through every experience card dated "… – Present" ──
// End a role by giving it a real end date; add one by adding a card. No other edits needed.

function initNow() {
  const el = document.getElementById('hero-now')
  if (!el) return
  const roles = [...document.querySelectorAll('.exp-card')]
    .filter((card) => /present/i.test(card.querySelector('.exp-date')?.textContent ?? ''))
    .map((card) => {
      const org = card.querySelector('.exp-org')?.textContent.trim()
      const role = card.querySelector('.exp-role')?.textContent.trim()
      return org && role ? `${role} @ ${org}` : null
    })
    .filter(Boolean)

  if (!roles.length) {
    el.closest('.hero-now')?.remove()
    return
  }

  el.textContent = roles[0]
  if (roles.length < 2) return

  let idx = 0
  let timer = 0
  const tick = async () => {
    idx = (idx + 1) % roles.length
    await scramble(el, roles[idx], { duration: 700 })
    timer = setTimeout(tick, 3200)
  }

  // Only spend cycles while the hero is on screen
  new IntersectionObserver(([entry]) => {
    clearTimeout(timer)
    if (entry.isIntersecting && !reducedMotion.matches) timer = setTimeout(tick, 3000)
  }).observe(el)
}

export function initHero() {
  splitName()
  initClock()
  initNow()
  const light = document.getElementById('ambient-light')
  if (light) initAmbient(light)
  requestAnimationFrame(() => document.documentElement.classList.add('is-loaded'))
}
