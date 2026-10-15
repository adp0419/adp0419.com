import { reducedMotion, finePointer } from './util.js'

// ─── Scroll reveal ────────────────────────────────────────────────────────────
// [data-reveal] cards fade up as they enter; their [data-reveal-child]
// descendants follow in a short stagger.

function initReveal() {
  const targets = document.querySelectorAll('[data-reveal]')
  targets.forEach((el) => {
    el.querySelectorAll('[data-reveal-child]').forEach((child, i) => {
      child.style.setProperty('--ri', Math.min(i, 8))
    })
  })

  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'))
    return
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-in')
      io.unobserve(entry.target)
    })
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 })

  targets.forEach((el) => io.observe(el))
}

// ─── Cursor spotlight ─────────────────────────────────────────────────────────
// Feeds pointer position into CSS vars; style.css draws a soft radial tint
// (cards) and a lit border segment (section fieldsets).

function initSpotlight() {
  if (!finePointer.matches) return
  document.querySelectorAll('.site-fieldset, .exp-card, .proj-item, .link-item').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }, { passive: true })
  })
}

// ─── Magnetic buttons ─────────────────────────────────────────────────────────
// Uses the standalone `translate` property so it composes with each button's
// existing hover `transform`.

function initMagnetic() {
  if (!finePointer.matches || reducedMotion.matches) return
  document.querySelectorAll('.magnetic').forEach((el) => {
    const strength = 0.22
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - (r.left + r.width / 2)) * strength
      const y = (e.clientY - (r.top + r.height / 2)) * strength
      el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`
    })
    el.addEventListener('pointerleave', () => { el.style.translate = '' })
  })
}

// ─── Scroll progress + experience timeline fill ───────────────────────────────

function initScrollLinked() {
  const bar = document.getElementById('nav-progress-bar')
  const expList = document.getElementById('exp-list')
  let ticking = false

  const update = () => {
    ticking = false
    const max = document.documentElement.scrollHeight - window.innerHeight
    if (bar) bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`

    if (expList) {
      const r = expList.getBoundingClientRect()
      const anchor = window.innerHeight * 0.6
      const p = Math.min(1, Math.max(0, (anchor - r.top) / r.height))
      expList.style.setProperty('--fill', p.toFixed(4))
    }
  }

  const onScroll = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(update)
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  update()
}

// ─── Experience: kind labels, computed durations, lit timeline dots ───────────

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function parseMonth(str) {
  const m = str.trim().toLowerCase().match(/^([a-z]{3})[a-z]*\s+(\d{4})$/)
  if (!m) return null
  const mi = MONTHS.indexOf(m[1])
  return mi < 0 ? null : Number(m[2]) * 12 + mi
}

function formatSpan(months) {
  const y = Math.floor(months / 12)
  const m = months % 12
  const parts = []
  if (y) parts.push(`${y} yr${y > 1 ? 's' : ''}`)
  if (m) parts.push(`${m} mo${m > 1 ? 's' : ''}`)
  return parts.join(' ')
}

function initExperience() {
  const cards = document.querySelectorAll('.exp-card')
  const now = new Date()
  const nowIdx = now.getFullYear() * 12 + now.getMonth()

  cards.forEach((card) => {
    const date = card.querySelector('.exp-date')
    if (date) {
      const [startStr, endStr] = date.textContent.split(/[–-]/)
      const start = parseMonth(startStr ?? '')
      const end = /present/i.test(endStr ?? '') ? nowIdx : parseMonth(endStr ?? '')
      if (/present/i.test(endStr ?? '')) card.classList.add('is-current')
      if (start != null && end != null && end >= start) {
        const span = document.createElement('span')
        span.className = 'exp-duration'
        span.textContent = formatSpan(end - start + 1)
        date.append(span)
      }
    }

    const head = card.querySelector('.exp-header > div:first-child')
    if (card.dataset.kind && head) {
      const kind = document.createElement('span')
      kind.className = 'exp-kind'
      kind.textContent = card.dataset.kind
      head.prepend(kind)
    }

    if (card.dataset.modal) {
      const more = document.createElement('span')
      more.className = 'exp-more'
      more.setAttribute('aria-hidden', 'true')
      more.textContent = 'details →'
      card.querySelector('.exp-meta')?.append(more)
    }
  })

  const count = document.getElementById('exp-count')
  if (count) count.textContent = `${cards.length} roles`

  if (reducedMotion.matches) {
    cards.forEach((c) => c.classList.add('is-lit'))
    return
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-lit'); io.unobserve(e.target) }
    })
  }, { rootMargin: '0px 0px -40% 0px' })
  cards.forEach((c) => io.observe(c))
}

function initFooter() {
  const year = document.getElementById('footer-year')
  if (year) year.textContent = new Date().getFullYear()
}

function greet() {
  console.log(
    '%cAryan Patel%c\nPoking around? Respect. Say hi → adp0419@gmail.com',
    'font: 600 20px "IBM Plex Sans", sans-serif; color: #0f172a',
    'font: 12px "IBM Plex Mono", monospace; color: #64748b',
  )
}

export function initFx() {
  initExperience()
  initReveal()
  initSpotlight()
  initMagnetic()
  initScrollLinked()
  initFooter()
  greet()
}
