// ─── Trophy case ──────────────────────────────────────────────────────────────
// Each .trophy in the shelf gets a line-art cup drawn into its cell (engraved
// with data-rank), and the shelf is topped up with empty "next" slots so the
// last row is always full. Adding a trophy = adding one <li> in index.html.

const COLS = 3

const cup = (id, rank = '') => `
  <svg viewBox="0 0 48 56" class="trophy-cup" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="M14 6H34V20C34 26.5 30 31 24 31C18 31 14 26.5 14 20Z"/></clipPath></defs>
    <path class="trophy-body" d="M14 6H34V20C34 26.5 30 31 24 31C18 31 14 26.5 14 20Z"/>
    <g clip-path="url(#${id})"><rect class="trophy-shine" x="-14" y="0" width="7" height="40" transform="skewX(-20)"/></g>
    <path class="trophy-line" d="M14 6H34V20C34 26.5 30 31 24 31C18 31 14 26.5 14 20Z M14 10H8V15C8 19 10.5 21.5 14.5 22 M34 10H40V15C40 19 37.5 21.5 33.5 22 M24 31V38 M17 38H31V43H17Z M13 43H35V49H13Z"/>
    ${rank ? `<text class="trophy-rank" x="24" y="21.5" text-anchor="middle">${rank}</text>` : ''}
  </svg>`

export function initTrophies() {
  const shelf = document.querySelector('.trophy-shelf')
  if (!shelf) return

  shelf.querySelectorAll('.trophy').forEach((t, i) => {
    t.querySelector('.trophy-cell')?.insertAdjacentHTML('afterbegin', cup(`trophy-clip-${i}`, t.dataset.rank))
  })

  const n = shelf.querySelectorAll('.trophy').length
  const total = Math.max(COLS, Math.ceil(n / COLS) * COLS)
  for (let i = n; i < total; i++) {
    shelf.insertAdjacentHTML('beforeend', `
      <li class="trophy is-empty" aria-hidden="true">
        <div class="trophy-cell">${cup(`trophy-clip-${i}`)}</div>
        <div class="trophy-plaque"><p class="trophy-date">next</p></div>
      </li>`)
  }
}
