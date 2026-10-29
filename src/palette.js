import { scrollToSection, scrollToCenter, flash, toast, copyText } from './util.js'

// ─── Command palette ("/") ────────────────────────────────────────────────────
// Items are collected from the page itself, so new sections, projects,
// experience cards, and links show up here automatically. Groups follow the
// page's own order; Actions sit last.

const openModal = (id) => document.dispatchEvent(new CustomEvent('modal:open', { detail: id }))
const EMAIL = 'adp0419@gmail.com'

const GROUPS = ['Navigate', 'Experience', 'Projects', 'Misc', 'Links', 'Actions']

function collectItems() {
  const items = []

  document.querySelectorAll('.hero-btn').forEach((a, i) => {
    items.push({
      group: 'Navigate',
      label: a.textContent.trim(),
      hint: String(i + 1),
      icon: '#',
      run: () => scrollToSection(a.getAttribute('href')),
    })
  })

  document.querySelectorAll('.exp-card').forEach((el) => {
    const org = el.querySelector('.exp-org')?.textContent.trim() ?? ''
    const role = el.querySelector('.exp-role')?.textContent.trim() ?? ''
    items.push({
      group: 'Experience',
      label: org,
      sub: role,
      keywords: `${role} ${el.dataset.kind ?? ''}`,
      icon: 'marker',
      run: () => {
        if (el.dataset.modal) return openModal(el.dataset.modal)
        scrollToCenter(el)
        setTimeout(() => flash(el), 450)
      },
    })
  })

  document.querySelectorAll('.proj-item').forEach((el) => {
    items.push({
      group: 'Projects',
      label: el.querySelector('.proj-item-title')?.textContent.trim() ?? '',
      sub: el.dataset.metric ?? '',
      keywords: el.querySelector('.proj-item-desc')?.textContent ?? '',
      icon: 'marker',
      run: () => openModal(el.dataset.modal),
    })
  })

  // Visible misc buttons (Technologies, and Background once it's un-hidden)
  document.querySelectorAll('#misc .misc-btn[data-modal]:not(.hidden)').forEach((btn) => {
    items.push({
      group: 'Misc',
      label: btn.textContent.trim(),
      keywords: { technologies: 'skills stack languages tools', milestones: 'achievements awards trophy hackathon wins' }[btn.dataset.modal] ?? '',
      icon: '□',
      run: () => openModal(btn.dataset.modal),
    })
  })

  document.querySelectorAll('.ms-item').forEach((el) => {
    items.push({
      group: 'Misc',
      label: el.querySelector('.ms-title')?.textContent.trim() ?? '',
      sub: el.querySelector('.ms-meta')?.textContent.trim() ?? '',
      keywords: `${el.closest('.ms-group')?.dataset.kind ?? ''} milestone achievement`,
      icon: '□',
      run: () => openModal('milestones'),
    })
  })

  document.querySelectorAll('#links .link-item').forEach((a) => {
    items.push({
      group: 'Links',
      label: a.querySelector('.link-label')?.textContent.trim() ?? a.textContent.trim(),
      sub: a.querySelector('.link-handle')?.textContent.trim() ?? '',
      icon: '↗',
      run: () => window.open(a.href, a.target || '_self', 'noopener'),
    })
  })

  const copy = (text, label) => async () => { await copyText(text); toast(`Copied ${label}`) }
  const linkedin = document.querySelector('#links a[href*="linkedin.com"]')?.href

  items.push(
    { group: 'Actions', label: 'Copy email', sub: EMAIL, icon: '⧉', run: copy(EMAIL, EMAIL) },
    { group: 'Actions', label: 'Write an email', sub: 'opens mail app', icon: '✉', run: () => { location.href = `mailto:${EMAIL}` } },
    { group: 'Actions', label: 'Copy link to this site', icon: '⧉', keywords: 'share url', run: copy(`${location.origin}/`, 'site link') },
  )
  if (linkedin) items.push({ group: 'Actions', label: 'Copy LinkedIn URL', icon: '⧉', run: copy(linkedin, 'LinkedIn URL') })

  // One "filter projects" action per category in the project filter bar
  const filterRoot = document.getElementById('proj-filters')
  filterRoot?.querySelectorAll('.proj-filter-opt').forEach((opt) => {
    items.push({
      group: 'Actions',
      label: `Show ${opt.textContent.trim()} projects`,
      keywords: 'filter',
      icon: '⌕',
      run: () => {
        filterRoot.querySelector('.proj-filter-clear')?.click()
        opt.click()
        scrollToSection('#projects')
      },
    })
  })
  if (filterRoot) {
    items.push({
      group: 'Actions',
      label: 'Show all projects',
      keywords: 'filter clear reset',
      icon: '⌕',
      run: () => { filterRoot.querySelector('.proj-filter-clear')?.click(); scrollToSection('#projects') },
    })
  }
  items.push({ group: 'Actions', label: 'Back to top', icon: '↑', run: () => scrollToSection('#hero') })

  return items
}

// Subsequence match with a bonus for contiguous runs and word starts
function score(query, text) {
  if (!query) return 1
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  const direct = t.indexOf(q)
  if (direct >= 0) return 100 - direct + (direct === 0 || t[direct - 1] === ' ' ? 20 : 0)
  let qi = 0, s = 0, run = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) { qi++; run++; s += run * 2 + (i === 0 || t[i - 1] === ' ' ? 4 : 0) }
    else run = 0
  }
  return qi === q.length ? s : 0
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function initPalette() {
  const root = document.createElement('div')
  root.className = 'palette'
  root.hidden = true
  root.innerHTML = `
    <div class="palette-backdrop" data-palette-close></div>
    <div class="palette-panel" role="dialog" aria-modal="true" aria-label="Search">
      <div class="palette-search">
        <span class="palette-prompt" aria-hidden="true">/</span>
        <input class="palette-input" type="text" placeholder="Search sections, experience, projects, links, actions…"
          autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true"
          aria-controls="palette-list" aria-autocomplete="list" />
        <kbd class="kbd">esc</kbd>
      </div>
      <div class="palette-list" id="palette-list" role="listbox"></div>
      <div class="palette-foot">
        <span><kbd class="kbd">↑</kbd><kbd class="kbd">↓</kbd><kbd class="kbd">←</kbd><kbd class="kbd">→</kbd> move</span>
        <span><kbd class="kbd">↵</kbd> open</span>
        <span class="ml-auto"><kbd class="kbd">1</kbd>–<kbd class="kbd">5</kbd> jump to section</span>
      </div>
    </div>`
  document.body.appendChild(root)

  const input = root.querySelector('.palette-input')
  const list = root.querySelector('.palette-list')
  const items = collectItems()
  const navItems = items.filter((it) => it.group === 'Navigate')
  let results = []
  let active = 0
  let lastFocus = null

  function render() {
    const q = input.value.trim()
    const scored = items
      .map((it) => ({ it, s: Math.max(score(q, it.label), score(q, `${it.sub ?? ''} ${it.keywords ?? ''}`) * 0.6) }))
      .filter((r) => r.s > 0)

    // Page order between groups; best match first within a group while searching
    results = []
    let best = { s: -1, i: 0 }
    const sections = GROUPS.map((group) => {
      const inGroup = scored.filter((r) => r.it.group === group)
      if (q) inGroup.sort((a, b) => b.s - a.s)
      return { group, rows: inGroup.map((r) => {
        const i = results.push(r.it) - 1
        if (r.s > best.s) best = { s: r.s, i }
        return { it: r.it, i }
      }) }
    }).filter((sec) => sec.rows.length)

    active = q ? best.i : Math.min(active, Math.max(0, results.length - 1))

    if (!results.length) {
      list.innerHTML = `<p class="palette-empty">No matches for “${esc(q)}”</p>`
      return
    }

    list.innerHTML = sections.map(({ group, rows }) => `
      <div class="palette-section" role="group" aria-label="${group}">
        <p class="palette-group">${group}</p>
        ${rows.map(({ it, i }) => `
          <div class="palette-item${i === active ? ' is-active' : ''}" role="option" id="pi-${i}"
               aria-selected="${i === active}" data-i="${i}">
            <span class="palette-icon" aria-hidden="true">${it.icon === 'marker' ? '<i class="palette-marker"></i>' : it.icon}</span>
            <span class="palette-label">${esc(it.label)}</span>
            ${it.sub ? `<span class="palette-sub">${esc(it.sub)}</span>` : ''}
            ${it.hint ? `<kbd class="kbd palette-hint">${it.hint}</kbd>` : ''}
          </div>`).join('')}
      </div>`).join('')
    input.setAttribute('aria-activedescendant', `pi-${active}`)
  }

  function setActive(i) {
    if (!results.length) return
    active = (i + results.length) % results.length
    list.querySelectorAll('.palette-item').forEach((el) => {
      const on = Number(el.dataset.i) === active
      el.classList.toggle('is-active', on)
      el.setAttribute('aria-selected', on)
      if (on) el.scrollIntoView({ block: 'nearest' })
    })
    input.setAttribute('aria-activedescendant', `pi-${active}`)
  }

  // ← → hop to the nearest item in the neighbouring column
  function moveAcross(dir) {
    const els = [...list.querySelectorAll('.palette-item')]
    const cur = els.find((el) => Number(el.dataset.i) === active)
    if (!cur) return false
    const r = cur.getBoundingClientRect()
    let best = null
    let bestDist = Infinity
    els.forEach((el) => {
      const b = el.getBoundingClientRect()
      const across = dir > 0 ? b.left >= r.right - 1 : b.right <= r.left + 1
      if (!across) return
      const d = Math.abs(b.top - r.top)
      if (d < bestDist) { bestDist = d; best = el }
    })
    if (!best) return false
    setActive(Number(best.dataset.i))
    return true
  }

  function open() {
    if (!root.hidden) return
    document.querySelectorAll('.modal:not([hidden])').forEach((m) => {
      m.querySelector('[data-close-modal]')?.click()
    })
    lastFocus = document.activeElement
    root.hidden = false
    root.classList.remove('is-closing')
    input.value = ''
    active = 0
    render()
    list.scrollTop = 0
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => input.focus())
  }

  function close({ restoreFocus = true } = {}) {
    if (root.hidden) return
    root.classList.add('is-closing')
    document.body.style.overflow = ''
    setTimeout(() => { root.hidden = true; root.classList.remove('is-closing') }, 140)
    if (restoreFocus) lastFocus?.focus?.({ preventScroll: true })
  }

  function runItem(it) {
    if (!it) return
    close({ restoreFocus: false })
    setTimeout(() => it.run(), 60)
  }

  input.addEventListener('input', () => { active = 0; render() })
  input.addEventListener('keydown', (e) => {
    // With an empty search, 1–5 jump straight to that section
    const n = Number(e.key)
    if (!input.value && n >= 1 && n <= navItems.length) {
      e.preventDefault()
      runItem(navItems[n - 1])
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1) }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      if (moveAcross(e.key === 'ArrowRight' ? 1 : -1)) e.preventDefault()
    }
    else if (e.key === 'Enter') { e.preventDefault(); runItem(results[active]) }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() }
    else if (e.key === 'Tab') e.preventDefault()
  })

  list.addEventListener('pointermove', (e) => {
    const el = e.target.closest('.palette-item')
    if (el && Number(el.dataset.i) !== active) setActive(Number(el.dataset.i))
  })
  list.addEventListener('click', (e) => {
    const el = e.target.closest('.palette-item')
    if (el) runItem(results[Number(el.dataset.i)])
  })
  root.querySelector('[data-palette-close]').addEventListener('click', () => close())

  document.querySelectorAll('[data-open-palette]').forEach((b) => b.addEventListener('click', open))

  // Global shortcuts: "/" opens search, 1–5 jump to sections
  document.addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea, [contenteditable="true"]')) return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (document.querySelector('.modal:not([hidden])') || !root.hidden) return
    if (e.key === '/') { e.preventDefault(); open(); return }
    const n = Number(e.key)
    if (n >= 1 && n <= navItems.length) {
      e.preventDefault()
      navItems[n - 1].run()
    }
  })
}
