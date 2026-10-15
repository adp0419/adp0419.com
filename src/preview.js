import { finePointer } from './util.js'

// ─── Project rows: index numbers + hover chart backdrop ───────────────────────
// Each row gets a faint generated chart (data-viz) behind its text that draws
// itself in on hover. Purely decorative — the modal holds the real detail.

const W = 720
const H = 60
const PAD = 4

// Deterministic RNG so each project's chart looks the same on every visit
function seeded(str) {
  let h = 2166136261
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const svg = (inner) =>
  `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="viz" aria-hidden="true">${inner}</svg>`

const charts = {
  // Cumulative return curve with a positive drift
  equity(rand) {
    const n = 48
    let v = 0
    const pts = []
    for (let i = 0; i < n; i++) {
      v += (rand() - 0.42) * 1.6
      pts.push(v)
    }
    const min = Math.min(...pts), max = Math.max(...pts)
    const xy = pts.map((p, i) => [
      PAD + (i / (n - 1)) * (W - PAD * 2),
      H - PAD - ((p - min) / (max - min || 1)) * (H - PAD * 2),
    ])
    const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('')
    const area = `${line}L${W - PAD},${H - PAD}L${PAD},${H - PAD}Z`
    const [ex, ey] = xy[xy.length - 1]
    return svg(`
      <line x1="${PAD}" x2="${W - PAD}" y1="${H - PAD}" y2="${H - PAD}" class="viz-axis"/>
      <path d="${area}" class="viz-area"/>
      <path d="${line}" class="viz-line" pathLength="1"/>
      <circle cx="${ex}" cy="${ey}" r="2.5" class="viz-dot"/>`)
  },

  // Actual vs predicted — points around the diagonal, fanning out at the top
  scatter(rand) {
    let dots = ''
    for (let i = 0; i < 110; i++) {
      const t = rand()
      const spread = 4 + t * 18
      const x = PAD + t * (W - PAD * 2)
      const y = H - PAD - t * (H - PAD * 2) + (rand() - 0.5) * spread
      dots += `<circle cx="${x.toFixed(1)}" cy="${Math.max(PAD, Math.min(H - PAD, y)).toFixed(1)}" r="2.4" class="viz-pt" style="--k:${i}"/>`
    }
    return svg(`
      <line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${PAD}" class="viz-diag"/>
      ${dots}`)
  },

  // Daily sentiment bars above / below zero
  sentiment(rand) {
    const n = 40
    const bw = (W - PAD * 2) / n
    const mid = H / 2
    let bars = ''
    for (let i = 0; i < n; i++) {
      const v = (rand() - 0.4) * (H / 2 - PAD) * 1.6
      const h = Math.max(2, Math.abs(v))
      const y = v > 0 ? mid - h : mid
      bars += `<rect x="${(PAD + i * bw + 1).toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${h.toFixed(1)}" class="${v > 0 ? 'viz-bar' : 'viz-bar-neg'}" style="--k:${i}"/>`
    }
    return svg(`<line x1="${PAD}" x2="${W - PAD}" y1="${mid}" y2="${mid}" class="viz-axis"/>${bars}`)
  },

  // 5★ → 1★ review distribution
  reviews(rand) {
    const rows = [0.62, 0.21, 0.08, 0.04, 0.05].map((v) => v * (0.85 + rand() * 0.3))
    const max = Math.max(...rows)
    const rh = (H - PAD * 2) / rows.length
    return svg(rows.map((v, i) => {
      const y = PAD + i * rh
      const bw = (v / max) * (W - PAD * 2)
      return `<rect x="${(W - PAD - bw).toFixed(1)}" y="${(y + 3).toFixed(1)}" width="${bw.toFixed(1)}" height="${(rh - 6).toFixed(1)}" class="viz-bar viz-grow" style="--k:${i}"/>`
    }).join(''))
  },

  // Speech waveform with visible pauses
  waveform(rand) {
    const n = 90
    const bw = (W - PAD * 2) / n
    const mid = H / 2
    let bars = ''
    let pause = 0
    for (let i = 0; i < n; i++) {
      if (pause <= 0 && rand() < 0.08) pause = 3 + ((rand() * 4) | 0)
      const amp = pause-- > 0 ? 1 : 4 + rand() * (H / 2 - PAD - 4)
      bars += `<rect x="${(PAD + i * bw).toFixed(1)}" y="${(mid - amp).toFixed(1)}" width="${Math.max(1, bw - 1.2).toFixed(1)}" height="${(amp * 2).toFixed(1)}" class="viz-bar viz-wave" style="--k:${i}"/>`
    }
    return svg(bars)
  },
}

export function initProjectRows() {
  document.querySelectorAll('.proj-item').forEach((item, i) => {
    const idx = item.querySelector('.proj-item-idx')
    if (idx) idx.textContent = String(i + 1).padStart(2, '0')

    if (!finePointer.matches) return
    const chart = charts[item.dataset.viz]?.(seeded(item.dataset.modal ?? String(i)))
    if (!chart) return
    const viz = document.createElement('div')
    viz.className = 'proj-item-viz'
    viz.setAttribute('aria-hidden', 'true')
    viz.innerHTML = chart
    item.prepend(viz)
  })
}
