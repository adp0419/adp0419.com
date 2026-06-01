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
