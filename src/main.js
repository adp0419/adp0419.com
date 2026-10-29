import { scrollToSection, reducedMotion } from './util.js'
import { initHero } from './hero.js'
import { initFx } from './fx.js'
import { initProjectRows } from './preview.js'
import { initPalette } from './palette.js'
import { initCursor } from './cursor.js'
import { initMilestones } from './milestones.js'

initHero()
initProjectRows()
initMilestones()
initFx()
initPalette()
initCursor()

// ─── Centered section scroll ──────────────────────────────────────────────────

document.querySelectorAll('.hero-btn, .nav-btn, a[href="#hero"], .scroll-cue, .bio-link').forEach((link) => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href')
    if (!href?.startsWith('#')) return
    e.preventDefault()
    scrollToSection(href)
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

let lastFocus = null

const isOpen = (modal) => !modal.hidden && !modal.classList.contains('is-closing')

function hideNow(modal) {
  modal.hidden = true
  modal.classList.remove('is-closing')
}

function openModal(id) {
  const modal = document.getElementById(`modal-${id}`)
  if (!modal || isOpen(modal)) return

  const others = document.querySelectorAll('.modal:not([hidden])')
  if (others.length) others.forEach(hideNow)
  else lastFocus = document.activeElement

  modal.hidden = false
  document.body.style.overflow = 'hidden'
  applyPdfView(modal)
  modal.querySelector('.modal-body')?.scrollTo(0, 0)
  modal.querySelector('.modal-close')?.focus({ preventScroll: true })
  // Shareable URL: adp0419.com/#proj-gap opens straight into this modal
  history.replaceState(null, '', `#${id}`)
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
  if (!isOpen(modal)) return
  history.replaceState(null, '', location.pathname + location.search)
  document.body.style.overflow = ''

  const done = () => {
    if (!modal.classList.contains('is-closing')) return
    hideNow(modal)
    lastFocus?.focus?.({ preventScroll: true })
    lastFocus = null
  }
  modal.classList.add('is-closing')
  if (reducedMotion.matches) return done()
  modal.querySelector('.modal-panel')?.addEventListener('animationend', done, { once: true })
  setTimeout(done, 320) // fallback if animationend never fires
}

document.addEventListener('modal:open', (e) => openModal(e.detail))

// Open via any element with data-modal (misc buttons, project items, etc.)
document.querySelectorAll('[data-modal]').forEach((el) => {
  el.addEventListener('click', () => openModal(el.dataset.modal))
  // Cards that act as buttons get keyboard support too
  if (el.getAttribute('role') === 'button') {
    el.addEventListener('keydown', (e) => {
      if (e.target !== el || (e.key !== 'Enter' && e.key !== ' ')) return
      e.preventDefault()
      openModal(el.dataset.modal)
    })
  }
})

// Exp-card logos link out to the org's site — don't also trigger the card's modal
document.querySelectorAll('a.exp-logo-wrap').forEach((link) => {
  link.addEventListener('click', (e) => e.stopPropagation())
})

// Close via backdrop or X button
document.querySelectorAll('[data-close-modal]').forEach((el) => {
  el.addEventListener('click', (e) => {
    const modal = e.currentTarget.closest('.modal')
    if (modal) closeModal(modal)
  })
})

// Keep Tab focus inside the open modal
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return
  const modal = document.querySelector('.modal:not([hidden])')
  if (!modal) return
  const focusables = [...modal.querySelectorAll('a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.hidden && el.offsetParent !== null)
  if (!focusables.length) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
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
    const count = document.getElementById('proj-count')
    if (count) {
      const shown = [...projItems].filter((i) => !i.classList.contains('hidden-proj')).length
      count.textContent = selected.size ? `showing ${shown} of ${projItems.length}` : `${projItems.length} projects`
    }
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

// ─── Polaroid photo deck (infinite carousel) ─────────────────────────────────
// Every card's position is computed each frame from one continuous `pos` that
// can count up or down forever — there are no ends, so nothing ever has to
// snap back or lock out clicks. Arrows only move `target`; rapid clicking just
// glides further. Real cards are duplicated in JS when there are few of them,
// so a card always wraps around while it's fully faded out at the edge.
// Optional .deck-description swaps text per photo (see deckDescriptions).

const deckReinits = new Map()

const deckDescriptions = {
  'house-deck': [
    'The model tracks actual sale prices well for homes under ~$750K, with dots clustering tightly around the ideal diagonal. Above $1M, predictions consistently fall short — the model underpredicts luxury homes.',
    'Location (Seattle) is the single strongest price driver, followed by above-ground living ratio and total square footage. Wealthy zip codes like WA 98112 and WA 98004 appear individually in the top 20.',
    'Square footage features are heavily intercorrelated (sqft_living and sqft_above at 0.87), revealing multicollinearity. Lot size has almost zero correlation with price (0.05), and above_ground_ratio shows a strong inverse relationship with basement size (-0.91).',
    'Residuals fan out in a funnel shape as predicted price increases — reasonably accurate for typical homes but errors exceeding $1M+ for high-value properties. This heteroscedasticity suggests a log-transformation or non-linear model could help.',
  ],
}

const mod = (n, m) => ((n % m) + m) % m

// ─── Lightbox: expands a deck's front photo ──────────────────────────────────
// One shared viewer. Arrows (and ← →) step the deck it came from, so the
// gallery behind stays in sync. Esc / backdrop close only the lightbox.

const lightbox = (() => {
  const root = document.createElement('div')
  root.className = 'lightbox'
  root.hidden = true
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-modal', 'true')
  root.setAttribute('aria-label', 'Image viewer')
  root.innerHTML = `
    <div class="lightbox-backdrop" data-lb-close></div>
    <figure class="lightbox-figure">
      <img class="lightbox-img" alt="" />
      <figcaption class="lightbox-caption"></figcaption>
      <p class="lightbox-desc"></p>
    </figure>
    <button type="button" class="lightbox-btn lightbox-prev" aria-label="Previous image">&#8249;</button>
    <button type="button" class="lightbox-btn lightbox-next" aria-label="Next image">&#8250;</button>
    <button type="button" class="lightbox-btn lightbox-close" data-lb-close aria-label="Close">&times;</button>`
  document.body.appendChild(root)

  const img   = root.querySelector('.lightbox-img')
  const title = root.querySelector('.lightbox-caption')
  const desc  = root.querySelector('.lightbox-desc')
  const closeBtn = root.querySelector('.lightbox-close')
  let deckApi = null
  let lastFocus = null

  function render() {
    const cur = deckApi.current()
    title.textContent = cur.title
    desc.textContent = cur.desc
    desc.hidden = !cur.desc
    if (img.getAttribute('src') === cur.src) return
    img.classList.add('is-swapping')
    const swap = () => { img.src = cur.src; img.alt = cur.alt }
    setTimeout(swap, img.getAttribute('src') ? 120 : 0)
  }
  img.addEventListener('load', () => img.classList.remove('is-swapping'))

  function open(api) {
    deckApi = api
    lastFocus = document.activeElement
    img.removeAttribute('src')
    render()
    root.hidden = false
    root.classList.remove('is-closing')
    closeBtn.focus({ preventScroll: true })
  }

  function close() {
    if (root.hidden || root.classList.contains('is-closing')) return
    root.classList.add('is-closing')
    setTimeout(() => {
      root.hidden = true
      root.classList.remove('is-closing')
      lastFocus?.focus?.({ preventScroll: true })
    }, reducedMotion.matches ? 0 : 180)
  }

  function step(dir) {
    deckApi.go(dir)
    render()
  }

  root.querySelectorAll('[data-lb-close]').forEach((el) => el.addEventListener('click', close))
  root.querySelector('.lightbox-prev').addEventListener('click', () => step(-1))
  root.querySelector('.lightbox-next').addEventListener('click', () => step(1))

  // Capture phase so Esc closes only the lightbox, not the project modal under it
  window.addEventListener('keydown', (e) => {
    if (root.hidden) return
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close() }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopImmediatePropagation(); step(-1) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopImmediatePropagation(); step(1) }
    else if (e.key === 'Tab') {
      // keep focus within the lightbox's buttons
      const btns = [...root.querySelectorAll('button')]
      const i = btns.indexOf(document.activeElement)
      e.preventDefault(); e.stopImmediatePropagation()
      btns[mod(i + (e.shiftKey ? -1 : 1), btns.length)].focus()
    }
  }, true)

  return { open }
})()

document.querySelectorAll('.photo-deck').forEach((deck) => {
  const track    = deck.querySelector('.deck-track-inner')
  const viewport = deck.querySelector('.deck-viewport')
  const descEl   = deck.querySelector('.deck-description')
  const descs    = deckDescriptions[deck.id] ?? []
  const real     = [...track.querySelectorAll('.deck-card')]
  const N        = real.length
  const GAP      = 24
  const FADE_END = 1.5   // cards this far from centre (in card widths) are fully faded

  // Ring of slots: enough copies that the wrap point (half the ring away) is
  // always beyond the visible range
  const copies = Math.max(1, Math.ceil(6 / N))
  const slots = []
  for (let k = 0; k < copies; k++) {
    real.forEach((card, i) => {
      const el = k === 0 ? card : card.cloneNode(true)
      if (k > 0) {
        el.setAttribute('aria-hidden', 'true')
        track.appendChild(el)
      }
      slots.push({ el, idx: k * N + i })
    })
  }
  const M = slots.length

  let pos = 0      // where the deck is right now (continuous)
  let target = 0   // where it's heading (whole numbers, unbounded)
  let raf = 0
  let last = 0

  function layout() {
    const cw = real[0].offsetWidth
    if (!cw) return
    track.style.height = `${real[0].offsetHeight}px`
    let centre = null
    let centreDist = Infinity
    for (const s of slots) {
      const d = mod(s.idx - pos + M / 2, M) - M / 2   // signed distance from centre
      const a = Math.abs(d)
      const near = Math.max(0, 1 - a)                  // 1 at centre → 0 one card away
      const opacity = a <= 1
        ? 0.6 + 0.4 * near
        : Math.max(0, 0.6 * (1 - (a - 1) / (FADE_END - 1)))
      const st = s.el.style
      st.transform = `translateX(-50%) translateX(${(d * (cw + GAP)).toFixed(2)}px) scale(${(0.88 + 0.12 * near).toFixed(4)})`
      st.opacity = opacity.toFixed(3)
      st.filter = near > 0.995 ? 'none' : `blur(${(2.5 * (1 - near)).toFixed(2)}px)`
      st.zIndex = String(10 - Math.round(a * 2))
      st.visibility = opacity < 0.005 ? 'hidden' : 'visible'
      if (a < centreDist) { centreDist = a; centre = s }
    }
    slots.forEach((s) => s.el.classList.toggle('active', s === centre))
    showDesc(mod(Math.round(pos), N))
  }

  function tick(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
    last = now
    const k = reducedMotion.matches ? 1 : 1 - Math.exp(-dt * 11)
    pos += (target - pos) * k
    if (Math.abs(target - pos) < 0.0005) pos = target
    layout()
    if (pos !== target) raf = requestAnimationFrame(tick)
    else { raf = 0; last = 0 }
  }

  const run = () => { if (!raf) raf = requestAnimationFrame(tick) }

  // Analysis text follows whichever photo is at the front: when a new one
  // passes the centre, the old text slides out the way the deck is moving and
  // the new one slides in. Swaps queue up so fast clicking can't strand it.
  let shown = 0
  let swapping = false
  let lastDir = 1
  function showDesc(i) {
    if (!descEl || !descs.length || i === shown || swapping) return
    swapping = true
    const dir = lastDir
    const outClass = dir > 0 ? 'slide-out-left' : 'slide-out-right'
    const inClass  = dir > 0 ? 'slide-in-left'  : 'slide-in-right'
    descEl.classList.add(outClass)
    setTimeout(() => {
      shown = mod(Math.round(pos), N)   // whatever is at the front *now*
      descEl.textContent = descs[shown]
      descEl.classList.remove(outClass)
      descEl.classList.add(inClass)
      void descEl.offsetWidth
      descEl.classList.remove(inClass)
      swapping = false
      showDesc(mod(Math.round(pos), N))  // catch up if the deck moved on meanwhile
    }, reducedMotion.matches ? 0 : 200)
  }

  function go(dir) {
    target += dir
    lastDir = dir
    run()
  }

  deck.querySelector('.deck-arrow-next').addEventListener('click', () => go(1))
  deck.querySelector('.deck-arrow-prev').addEventListener('click', () => go(-1))

  // What the lightbox needs: the photo currently heading to the front
  const api = {
    go,
    current() {
      const i = mod(target, N)
      const card = real[i]
      const im = card.querySelector('img')
      return {
        i, n: N,
        src: im.currentSrc || im.src,
        alt: im.alt,
        title: card.querySelector('.deck-caption')?.textContent.trim() ?? '',
        desc: descs[i] ?? '',
      }
    },
  }

  // Click the front photo to expand it; click a side photo to bring it forward
  function activate(cardEl) {
    const slot = slots.find((s) => s.el === cardEl)
    if (!slot) return
    const d = Math.round(mod(slot.idx - target + M / 2, M) - M / 2)
    if (d === 0) lightbox.open(api)
    else go(Math.sign(d))
  }

  real.forEach((card) => {
    card.tabIndex = 0
    card.setAttribute('role', 'button')
    card.setAttribute('aria-label', `${card.querySelector('.deck-caption')?.textContent.trim() ?? 'Photo'} — expand`)
    card.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      activate(card)
    })
  })

  // Swipe / drag to advance (a swipe shouldn't also count as a click)
  let swipeX = null
  let swiped = false
  viewport.addEventListener('pointerdown', (e) => { swipeX = e.clientX; swiped = false })
  viewport.addEventListener('pointerup', (e) => {
    if (swipeX == null) return
    const dx = e.clientX - swipeX
    swipeX = null
    if (Math.abs(dx) >= 40) { swiped = true; go(dx < 0 ? 1 : -1) }
  })
  viewport.addEventListener('click', (e) => {
    if (swiped) { swiped = false; return }
    const cardEl = e.target.closest('.deck-card')
    if (cardEl) activate(cardEl)
  })
  viewport.addEventListener('pointercancel', () => { swipeX = null })
  viewport.style.touchAction = 'pan-y'

  window.addEventListener('resize', () => { if (deck.offsetParent) layout() })

  deckReinits.set(deck.id, () => {
    cancelAnimationFrame(raf)
    raf = 0
    last = 0
    pos = target = 0
    shown = 0
    swapping = false
    if (descEl && descs.length) {
      descEl.classList.remove('slide-out-left', 'slide-out-right')
      descEl.textContent = descs[0]
    }
    layout()
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

// Deep link: open the modal named in the URL hash (e.g. /#proj-echo)
const initialModal = decodeURIComponent(location.hash.slice(1))
if (initialModal && document.getElementById(`modal-${initialModal}`)) openModal(initialModal)
