import { reducedMotion } from './util.js'

// ─── Ambient light ────────────────────────────────────────────────────────────
// One huge, soft shadow-light behind the whole site that lazily follows the
// cursor. With no pointer (idle, touch), it drifts slowly on its own.
// It's a single blurred element moved with transforms, so it stays cheap.

const FOLLOW = 0.045   // how quickly the light catches up to the cursor

export function initAmbient(light) {
  const pos = { x: window.innerWidth * 0.6, y: window.innerHeight * 0.45 }
  const target = { x: pos.x, y: pos.y }
  let active = 0         // 0 = idle drift, 1 = following the cursor
  let pointerInside = false

  const place = () => {
    light.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`
  }

  if (reducedMotion.matches) {
    place()
    return
  }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    target.x = e.clientX
    target.y = e.clientY
    pointerInside = true
  }, { passive: true })
  document.documentElement.addEventListener('pointerleave', () => { pointerInside = false })

  function tick(now) {
    const w = window.innerWidth, h = window.innerHeight
    active += ((pointerInside ? 1 : 0) - active) * 0.03
    const driftX = w * (0.5 + 0.25 * Math.sin(now * 0.00025))
    const driftY = h * (0.45 + 0.1 * Math.cos(now * 0.00019))
    const tx = target.x * active + driftX * (1 - active)
    const ty = target.y * active + driftY * (1 - active)
    pos.x += (tx - pos.x) * FOLLOW
    pos.y += (ty - pos.y) * FOLLOW
    place()
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
