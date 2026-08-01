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

    // Center the section card (the visible "box") on screen
    const card = section.querySelector('.site-fieldset') ?? section
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

const mobilePdfMq = window.matchMedia('(max-width: 639px)')
const pdfTouchCache = new WeakMap()
let pdfjsLibPromise = null

function loadPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjs, worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default
      return pdfjs
    })
  }
  return pdfjsLibPromise
}

function touchDistance(t1, t2) {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
}

function setupPinchZoom(inner, container) {
  let scale = 1
  let startDist = 0
  let startScale = 1

  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      startDist = touchDistance(e.touches[0], e.touches[1])
      startScale = scale
    }
  }, { passive: true })

  container.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && startDist > 0) {
      e.preventDefault()
      const dist = touchDistance(e.touches[0], e.touches[1])
      scale = Math.min(4, Math.max(0.75, startScale * (dist / startDist)))
      inner.style.zoom = scale
    }
  }, { passive: false })

  container.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) startDist = 0
  })
}

async function renderTouchPdfViewer(wrap, url) {
  const touch = document.createElement('div')
  touch.className = 'proj-pdf-touch'
  const inner = document.createElement('div')
  inner.className = 'proj-pdf-touch-inner'
  const loading = document.createElement('p')
  loading.className = 'proj-pdf-touch-loading'
  loading.textContent = 'Loading PDF…'
  inner.appendChild(loading)
  touch.appendChild(inner)
  wrap.appendChild(touch)

  const pdfjs = await loadPdfjs()
  const pdf = await pdfjs.getDocument(url).promise
  inner.innerHTML = ''

  const containerWidth = touch.clientWidth || wrap.clientWidth
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const unscaled = page.getViewport({ scale: 1 })
    const scale = containerWidth / unscaled.width
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: ctx, viewport }).promise
    inner.appendChild(canvas)
  }

  setupPinchZoom(inner, touch)
  pdfTouchCache.set(wrap, touch)
}

async function syncPdfWrap(wrap) {
  const iframe = wrap.querySelector('iframe')
  if (!iframe) return

  const base = iframe.dataset.pdfBase ?? iframe.src.split('#')[0]
  iframe.dataset.pdfBase = base

  if (mobilePdfMq.matches) {
    iframe.hidden = true
    if (!pdfTouchCache.has(wrap)) {
      await renderTouchPdfViewer(wrap, base)
    }
    const touch = wrap.querySelector('.proj-pdf-touch')
    if (touch) touch.hidden = false
    return
  }

  const touch = wrap.querySelector('.proj-pdf-touch')
  if (touch) touch.hidden = true
  iframe.hidden = false
  iframe.src = `${base}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`
}

function applyPdfView(modal) {
  modal.querySelectorAll('.proj-pdf-wrap').forEach((wrap) => {
    syncPdfWrap(wrap)
  })
}

function openModal(id) {
  const modal = document.getElementById(`modal-${id}`)
  if (!modal) return
  modal.removeAttribute('hidden')
  document.body.style.overflow = 'hidden'
  applyPdfView(modal)
  modal.querySelector('.modal-close')?.focus()
  // Reinit any photo decks now that the modal is visible and measurable
  requestAnimationFrame(() => {
    modal.querySelectorAll('.photo-deck').forEach(deck => {
      deckReinits.get(deck.id)?.()
    })
  })
}

mobilePdfMq.addEventListener('change', () => {
  document.querySelectorAll('.modal:not([hidden])').forEach(applyPdfView)
})

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

// ─── Project filters (category only, multi-select AND) ───────────────────────

const projFilters = document.getElementById('proj-filters')
const projItems   = document.querySelectorAll('.proj-item')

if (projFilters) {
  const selected = new Set()
  const row = projFilters.querySelector('.proj-filter-row')

  function updateScrollFades() {
    const viewport = row.querySelector('.proj-filter-viewport')
    const scroll = row.querySelector('.proj-filter-scroll')
    if (!viewport || !scroll) return

    const maxScroll = scroll.scrollWidth - scroll.clientWidth
    viewport.classList.toggle('can-scroll-left', scroll.scrollLeft > 4)
    viewport.classList.toggle('can-scroll-right', maxScroll > 4 && scroll.scrollLeft < maxScroll - 4)
  }

  function initDragScroll() {
    const scroll = row.querySelector('.proj-filter-scroll')
    if (!scroll || scroll.dataset.dragInit) return
    scroll.dataset.dragInit = '1'

    let isDown = false
    let startX = 0
    let scrollStart = 0
    let dragged = false

    scroll.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return
      if (e.target.closest('.proj-filter-opt')) return
      isDown = true
      dragged = false
      startX = e.pageX
      scrollStart = scroll.scrollLeft
      scroll.classList.add('is-dragging')
    })

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return
      const dx = e.pageX - startX
      if (Math.abs(dx) > 6) dragged = true
      scroll.scrollLeft = scrollStart - dx
      updateScrollFades()
    })

    window.addEventListener('mouseup', (e) => {
      if (!isDown) return
      if (Math.abs(e.pageX - startX) <= 6) dragged = false
      isDown = false
      scroll.classList.remove('is-dragging')
    })

    scroll.addEventListener('scroll', () => updateScrollFades(), { passive: true })

    scroll.addEventListener('click', (e) => {
      if (!dragged) return
      e.preventDefault()
      e.stopPropagation()
      dragged = false
    }, true)
  }

  function refreshRow() {
    updateScrollFades()
    requestAnimationFrame(updateScrollFades)
  }

  initDragScroll()
  row.querySelector('.proj-filter-expand')?.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'max-width') refreshRow()
  })
  new ResizeObserver(refreshRow).observe(row)

  row.addEventListener('mouseleave', () => {
    row.classList.remove('suppress-hover')
  })

  function clearSelections() {
    selected.clear()
    row.querySelectorAll('.proj-filter-opt.active').forEach((o) => o.classList.remove('active'))
    updateRowState()
    applyProjFilters()
  }

  function updateRowState() {
    const count = selected.size
    row.classList.toggle('has-active', count > 0)
    const trigger = row.querySelector('.proj-filter-trigger')
    trigger.textContent = count ? `Filter (${count})` : 'Filter'
  }

  function applyProjFilters() {
    projItems.forEach((item) => {
      const cats = item.dataset.categories?.split(' ') ?? []
      const match = selected.size === 0 ||
        [...selected].every((c) => cats.includes(c))
      item.classList.toggle('hidden-proj', !match)
    })
  }

  projFilters.addEventListener('click', (e) => {
    const trigger = e.target.closest('.proj-filter-trigger')
    if (trigger) {
      e.stopPropagation()
      const open = row.classList.toggle('is-open')
      trigger.setAttribute('aria-expanded', open)
      if (!open) {
        row.classList.add('suppress-hover')
        trigger.blur()
      }
      refreshRow()
      return
    }

    const clearBtn = e.target.closest('.proj-filter-clear')
    if (clearBtn) {
      e.stopPropagation()
      clearSelections()
      return
    }

    const opt = e.target.closest('.proj-filter-opt')
    if (!opt) return

    e.stopPropagation()
    const { value } = opt.dataset

    if (selected.has(value)) selected.delete(value)
    else selected.add(value)

    opt.classList.toggle('active', selected.has(value))
    updateRowState()
    applyProjFilters()
  })
}

// ─── Polaroid photo deck (infinite sliding carousel) ─────────────────────────
// Generic: works with any number of cards. Layout: [clone-of-last | real-1 ... real-N | clone-of-first].
// Boundary at 0 → jump to lastReal. Boundary at cards.length-1 → jump to 1.
// Optional .deck-description element swaps text per slide via data-descriptions JSON.

const deckReinits = new Map()

const deckDescriptions = {
  'house-deck': {
    1: 'The model tracks actual sale prices well for homes under ~$750K, with dots clustering tightly around the ideal diagonal. Above $1M, predictions consistently fall short — the model underpredicts luxury homes.',
    2: 'Location (Seattle) is the single strongest price driver, followed by above-ground living ratio and total square footage. Wealthy zip codes like WA 98112 and WA 98004 appear individually in the top 20.',
    3: 'Square footage features are heavily intercorrelated (sqft_living and sqft_above at 0.87), revealing multicollinearity. Lot size has almost zero correlation with price (0.05), and above_ground_ratio shows a strong inverse relationship with basement size (-0.91).',
    4: 'Residuals fan out in a funnel shape as predicted price increases — reasonably accurate for typical homes but errors exceeding $1M+ for high-value properties. This heteroscedasticity suggests a log-transformation or non-linear model could help.',
  },
}

document.querySelectorAll('.photo-deck').forEach((deck) => {
  const track     = deck.querySelector('.deck-track-inner')
  const viewport  = deck.querySelector('.deck-viewport')
  const cards     = [...track.querySelectorAll('.deck-card')]
  const descEl    = deck.querySelector('.deck-description')
  const descs     = deckDescriptions[deck.id] || {}
  const gap       = 24
  const lastReal  = cards.length - 2   // last real card index
  let current     = 1
  let busy        = false
  let pending     = 0

  function calcOffset(idx) {
    const cw  = cards[0].offsetWidth
    const vpW = viewport.offsetWidth
    return -(idx * (cw + gap)) + (vpW - cw) / 2
  }

  let lastDir = 1 // 1 = next, -1 = prev

  function updateDesc(idx, dir) {
    if (!descEl || !descs[idx]) return
    if (dir) lastDir = dir

    const outClass = lastDir > 0 ? 'slide-out-left' : 'slide-out-right'
    const inClass  = lastDir > 0 ? 'slide-in-left'  : 'slide-in-right'

    descEl.classList.add(outClass)

    setTimeout(() => {
      descEl.textContent = descs[idx]
      descEl.classList.remove(outClass)
      descEl.classList.add(inClass)
      void descEl.offsetWidth
      descEl.classList.remove(inClass)
    }, 210)
  }

  function jumpTo(idx) {
    track.style.transition = 'none'
    cards.forEach((c, i) => c.classList.toggle('active', i === idx))
    track.style.transform = `translateX(${calcOffset(idx)}px)`
    current = idx
    updateDesc(idx)
    void track.offsetWidth
    track.style.transition = ''
    busy = false
  }

  function slideTo(idx, dir) {
    busy = true
    cards.forEach((c, i) => c.classList.toggle('active', i === idx))
    track.style.transform = `translateX(${calcOffset(idx)}px)`
    current = idx
    updateDesc(idx, dir)
  }

  function tryAdvance() {
    if (busy) return
    if (pending > 0) { pending--; slideTo(current + 1, 1) }
    else if (pending < 0) { pending++; slideTo(current - 1, -1) }
  }

  track.addEventListener('transitionend', (e) => {
    if (e.target !== track || e.propertyName !== 'transform') return
    if (current >= cards.length - 1) jumpTo(1)
    else if (current <= 0) jumpTo(lastReal)
    else busy = false
    tryAdvance()
  })

  deck.querySelector('.deck-arrow-next').addEventListener('click', () => { pending++; tryAdvance() })
  deck.querySelector('.deck-arrow-prev').addEventListener('click', () => { pending--; tryAdvance() })

  deckReinits.set(deck.id, () => { pending = 0; jumpTo(1) })
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

    current.classList.remove('active')
    current.classList.add('swiping-out')

    setTimeout(() => next.classList.add('active'), 160)

    current.addEventListener('animationend', () => {
      current.classList.remove('swiping-out')
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
