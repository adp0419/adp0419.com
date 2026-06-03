// ─── Centered section scroll ──────────────────────────────────────────────────

document.querySelectorAll('.hero-btn, .nav-btn, a[href="#hero"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href')
    if (!href?.startsWith('#')) return
    e.preventDefault()

    // "Aryan Patel" logo → back to very top
    if (href === '#hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const section = document.querySelector(href)
    if (!section) return

    // Center the fieldset card (the visible "box") on screen
    const card = section.querySelector('fieldset') ?? section
    const cardTop    = card.getBoundingClientRect().top + window.scrollY
    const cardHeight = card.offsetHeight
    const vh         = window.innerHeight
    const maxScroll  = document.documentElement.scrollHeight - vh

    const target = Math.round(cardTop - vh / 2 + cardHeight / 2)
    window.scrollTo({ top: Math.max(0, Math.min(target, maxScroll)), behavior: 'smooth' })
  })
})

// ─── Sticky nav ───────────────────────────────────────────────────────────────

const stickyNav = document.getElementById('sticky-nav')
const hero = document.getElementById('hero')

const heroObserver = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) {
      stickyNav.classList.remove('visible')
      stickyNav.setAttribute('aria-hidden', 'true')
    } else {
      stickyNav.classList.add('visible')
      stickyNav.removeAttribute('aria-hidden')
    }
  },
  { threshold: 0.1 }
)

heroObserver.observe(hero)

// ─── Active nav section highlight ─────────────────────────────────────────────

const sections = ['about', 'experience', 'projects', 'misc', 'links']
const navBtns = document.querySelectorAll('.nav-btn')

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id
        navBtns.forEach((btn) => {
          const href = btn.getAttribute('href')
          btn.classList.toggle('active', href === `#${id}`)
        })
      }
    })
  },
  { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
)

sections.forEach((id) => {
  const el = document.getElementById(id)
  if (el) sectionObserver.observe(el)
})

// ─── Modals ────────────────────────────────────────────────────────────────────

function openModal(id) {
  const modal = document.getElementById(`modal-${id}`)
  if (!modal) return
  modal.removeAttribute('hidden')
  document.body.style.overflow = 'hidden'
  modal.querySelector('.modal-close')?.focus()
  // Reinit any photo decks now that the modal is visible and measurable
  requestAnimationFrame(() => {
    modal.querySelectorAll('.photo-deck').forEach(deck => {
      deckReinits.get(deck.id)?.()
    })
  })
}

function closeModal(modal) {
  modal.setAttribute('hidden', '')
  document.body.style.overflow = ''
}

// Open via any element with data-modal (misc buttons, project items, etc.)
document.querySelectorAll('[data-modal]').forEach((el) => {
  el.addEventListener('click', () => openModal(el.dataset.modal))
})

// Close via backdrop or X button
document.querySelectorAll('[data-close-modal]').forEach((el) => {
  el.addEventListener('click', (e) => {
    const modal = e.currentTarget.closest('.modal')
    if (modal) closeModal(modal)
  })
})

// ─── Project category filter ─────────────────────────────────────────────────

const filterBar = document.getElementById('proj-filter-bar')
const projItems = document.querySelectorAll('.proj-item')

if (filterBar) {
  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.proj-filter-btn')
    if (!btn) return

    const filter = btn.dataset.filter

    filterBar.querySelectorAll('.proj-filter-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.filter === filter)
    })

    projItems.forEach((item) => {
      if (filter === 'all') {
        item.classList.remove('hidden-proj')
      } else {
        const cats = item.dataset.categories?.split(' ') ?? []
        item.classList.toggle('hidden-proj', !cats.includes(filter))
      }
    })
  })
}

// ─── Polaroid photo deck (infinite sliding carousel) ─────────────────────────
// Track: [p3-clone(0) | p1(1) | p2(2) | p3(3) | p1-clone(4)]. Initial center: 1.
// ›  = next = increment. ‹ = prev = decrement.
// Boundary 4 → jump to real 1.  Boundary 0 → jump to real 3.
// jumpTo() uses force-reflow (void offsetWidth) instead of double-rAF
// so there's no async gap between the invisible jump and re-enabling the transition.
// transitionend is filtered to track's OWN transform only (e.target === track)
// to avoid bubbled events from child card transitions triggering the jump early.

const deckReinits = new Map()

document.querySelectorAll('.photo-deck').forEach((deck) => {
  const track    = deck.querySelector('.deck-track-inner')
  const viewport = deck.querySelector('.deck-viewport')
  const cards    = [...track.querySelectorAll('.deck-card')]
  const gap      = 24
  let current    = 1
  let busy       = false
  let pending    = 0

  function offset(idx) {
    const cw  = cards[0].offsetWidth
    const vpW = viewport.offsetWidth
    return -(idx * (cw + gap)) + (vpW - cw) / 2
  }

  function jumpTo(idx) {
    track.style.transition = 'none'
    cards.forEach((c, i) => c.classList.toggle('active', i === idx))
    track.style.transform = `translateX(${offset(idx)}px)`
    current = idx
    void track.offsetWidth   // force reflow — makes the transition:none take effect immediately
    track.style.transition = ''
    busy = false
  }

  function slideTo(idx) {
    busy = true
    cards.forEach((c, i) => c.classList.toggle('active', i === idx))
    track.style.transform = `translateX(${offset(idx)}px)`
    current = idx
  }

  function tryAdvance() {
    if (busy) return
    if (pending > 0) {
      pending--
      slideTo(current + 1)
    } else if (pending < 0) {
      pending++
      slideTo(current - 1)
    }
  }

  // Only respond to the track's own transform transition — not bubbled card transitions
  track.addEventListener('transitionend', (e) => {
    if (e.target !== track || e.propertyName !== 'transform') return
    if (current === 4) jumpTo(1)
    else if (current === 0) jumpTo(3)
    else busy = false
    tryAdvance()
  })

  // › = next (right card to center = increment)
  deck.querySelector('.deck-arrow-next').addEventListener('click', () => {
    pending++
    tryAdvance()
  })
  // ‹ = prev (left card to center = decrement)
  deck.querySelector('.deck-arrow-prev').addEventListener('click', () => {
    pending--
    tryAdvance()
  })

  // Register a reinit so openModal can call it after the modal is visible
  deckReinits.set(deck.id, () => {
    pending = 0
    jumpTo(1)
  })
})

// ─── Polaroid card swipe ──────────────────────────────────────────────────────

const polaroidStack = document.getElementById('polaroid-stack')

if (polaroidStack) {
  const cards = Array.from(polaroidStack.querySelectorAll('.polaroid-card'))
  let activeIdx = cards.findIndex(c => c.classList.contains('active'))
  let swiping = false

  polaroidStack.addEventListener('click', () => {
    if (swiping) return
    swiping = true

    const current = cards[activeIdx]
    const nextIdx = (activeIdx + 1) % cards.length
    const next    = cards[nextIdx]

    // 1. Swipe the top card out to the right
    current.classList.remove('active')
    current.classList.add('swiping-out')

    // 2. After a short delay, lift the next card forward
    setTimeout(() => next.classList.add('active'), 160)

    // 3. Once the swipe animation ends, park the card back in the deck
    current.addEventListener('animationend', () => {
      current.classList.remove('swiping-out')
      // card is now back in its default deck-position styles
      activeIdx = nextIdx
      swiping = false
    }, { once: true })
  })
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal:not([hidden])').forEach(closeModal)
  }
})
