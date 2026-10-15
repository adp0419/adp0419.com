// ─── Shared helpers ───────────────────────────────────────────────────────────

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
export const finePointer   = window.matchMedia('(hover: hover) and (pointer: fine)')

const scrollBehavior = () => (reducedMotion.matches ? 'auto' : 'smooth')

// Centers an element (or a section's card) in the viewport
export function scrollToCenter(el) {
  const top    = el.getBoundingClientRect().top + window.scrollY
  const vh     = window.innerHeight
  const max    = document.documentElement.scrollHeight - vh
  const target = Math.round(top - vh / 2 + el.offsetHeight / 2)
  window.scrollTo({ top: Math.max(0, Math.min(target, max)), behavior: scrollBehavior() })
}

export function scrollToSection(href) {
  if (href === '#hero') {
    window.scrollTo({ top: 0, behavior: scrollBehavior() })
    return
  }
  const section = document.querySelector(href)
  if (!section) return
  const card = section.querySelector('.site-fieldset') ?? section
  // Very tall cards can't be centered — align their top just under the nav instead
  if (card.offsetHeight > window.innerHeight - 120) {
    const top = card.getBoundingClientRect().top + window.scrollY - 72
    window.scrollTo({ top, behavior: scrollBehavior() })
  } else {
    scrollToCenter(card)
  }
}

// Briefly outlines an element so the eye can find it after a jump
export function flash(el) {
  el.classList.remove('flash')
  void el.offsetWidth
  el.classList.add('flash')
  el.addEventListener('animationend', () => el.classList.remove('flash'), { once: true })
}

// ─── Toast ────────────────────────────────────────────────────────────────────

let toastEl = null
let toastTimer = 0

export function toast(message) {
  if (!toastEl) {
    toastEl = document.createElement('div')
    toastEl.className = 'toast'
    toastEl.setAttribute('role', 'status')
    toastEl.setAttribute('aria-live', 'polite')
    document.body.appendChild(toastEl)
  }
  toastEl.textContent = message
  toastEl.classList.add('is-visible')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2200)
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text })
    ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
}

// ─── Text scramble (mono "decode" effect) ─────────────────────────────────────

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz<>/\\_-=+*#'

export function scramble(el, text, { duration = 700 } = {}) {
  if (reducedMotion.matches) {
    el.textContent = text
    return Promise.resolve()
  }
  const from = el.textContent
  const len = Math.max(from.length, text.length)
  const queue = Array.from({ length: len }, (_, i) => {
    const start = Math.random() * duration * 0.4
    const end = start + duration * 0.3 + Math.random() * duration * 0.3
    return { from: from[i] ?? '', to: text[i] ?? '', start, end }
  })
  cancelAnimationFrame(el._scrambleRaf)

  return new Promise((resolve) => {
    const t0 = performance.now()
    const frame = (now) => {
      const t = now - t0
      let out = ''
      let done = 0
      for (const q of queue) {
        if (t >= q.end) { out += q.to; done++ }
        else if (t >= q.start) out += q.to === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]
        else out += q.from
      }
      el.textContent = out
      if (done === queue.length) resolve()
      else el._scrambleRaf = requestAnimationFrame(frame)
    }
    el._scrambleRaf = requestAnimationFrame(frame)
  })
}
