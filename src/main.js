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

// Open via misc buttons
document.querySelectorAll('.misc-btn[data-modal]').forEach((btn) => {
  btn.addEventListener('click', () => openModal(btn.dataset.modal))
})

// Close via backdrop or X button
document.querySelectorAll('[data-close-modal]').forEach((el) => {
  el.addEventListener('click', (e) => {
    const modal = e.currentTarget.closest('.modal')
    if (modal) closeModal(modal)
  })
})

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal:not([hidden])').forEach(closeModal)
  }
})
