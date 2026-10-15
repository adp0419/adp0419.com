import { finePointer, reducedMotion } from './util.js'

// ─── Custom cursor ────────────────────────────────────────────────────────────
// A square dot that tracks the pointer exactly, plus four corner brackets that
// trail behind it. Over interactive elements (and experience cards) the brackets
// lock on and frame the element; over anything huge they just open up.
// Mouse/trackpad only.

const INTERACTIVE = 'a, button, [role="button"], [data-modal], .exp-card, .proj-filter-opt, .proj-filter-clear, .proj-filter-trigger, .palette-item'
const TEXT_ENTRY = 'input, textarea, [contenteditable="true"]'
const LOCK_MAX_W = 1000     // lock onto elements up to this size (incl. experience
const LOCK_MAX_H = 160      // cards and project rows)…
const LOCK_PAD = 6          // …with this much breathing room
const FREE_SIZE = 22
const OPEN_SIZE = 38

export function initCursor() {
  if (!finePointer.matches) return

  const dot = document.createElement('div')
  dot.className = 'cursor-dot'
  const frame = document.createElement('div')
  frame.className = 'cursor-frame'
  frame.innerHTML = '<i></i><i></i><i></i><i></i>'
  document.body.append(frame, dot)
  document.documentElement.classList.add('has-cursor')

  const p = { x: -100, y: -100 }
  const f = { x: -100, y: -100, w: FREE_SIZE, h: FREE_SIZE }
  let target = null      // element the brackets are locked onto
  let open = false       // hovering something large and clickable
  let visible = false

  function setVisible(v) {
    if (v === visible) return
    visible = v
    document.documentElement.classList.toggle('cursor-visible', v)
  }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    p.x = e.clientX
    p.y = e.clientY
    dot.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
    if (!visible) { f.x = p.x; f.y = p.y }
    setVisible(!e.target.closest?.(TEXT_ENTRY))
  }, { passive: true })

  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest?.(INTERACTIVE)
    target = null
    open = false
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.width <= LOCK_MAX_W && r.height <= LOCK_MAX_H) target = el
    else open = true
  })

  // Leaving the window, or moving into an iframe (PDF previews), hides it
  document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) setVisible(false) })
  window.addEventListener('blur', () => setVisible(false))

  window.addEventListener('pointerdown', () => frame.classList.add('is-down'))
  window.addEventListener('pointerup', () => frame.classList.remove('is-down'))

  function tick() {
    let tx, ty, tw, th
    if (target && target.isConnected && target.offsetParent !== null) {
      const r = target.getBoundingClientRect()
      tx = r.left + r.width / 2
      ty = r.top + r.height / 2
      tw = r.width + LOCK_PAD * 2
      th = r.height + LOCK_PAD * 2
    } else {
      tx = p.x
      ty = p.y
      tw = th = open ? OPEN_SIZE : FREE_SIZE
    }

    const k = reducedMotion.matches ? 1 : 0.22
    f.x += (tx - f.x) * k
    f.y += (ty - f.y) * k
    f.w += (tw - f.w) * k
    f.h += (th - f.h) * k

    frame.style.transform = `translate3d(${(f.x - f.w / 2).toFixed(2)}px, ${(f.y - f.h / 2).toFixed(2)}px, 0)`
    frame.style.width = `${f.w.toFixed(2)}px`
    frame.style.height = `${f.h.toFixed(2)}px`
    frame.classList.toggle('is-locked', !!target)
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
