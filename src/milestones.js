// ─── Milestones ───────────────────────────────────────────────────────────────
// Each .ms-group[data-kind] gets its icon drawn into every item, and a count
// next to its label. Adding a milestone = adding one <li> to the right group;
// a new kind just needs an icon below.

const ICONS = {
  hackathon: '<path d="M8 4H16V9C16 11.5 14.2 13 12 13C9.8 13 8 11.5 8 9Z M8 6H5V8C5 9.5 6 10.5 8 10.5 M16 6H19V8C19 9.5 18 10.5 16 10.5 M12 13V16 M9 16H15V18H9Z M7.5 18H16.5V20H7.5Z"/>',
  internship: '<path d="M4 8H20V19H4Z M9 8V5H15V8 M4 12.5H20 M11 12.5V14.5H13V12.5"/>',
  award: '<path d="M8 3L10 9 M16 3L14 9 M12 9A5 5 0 1 0 12 19A5 5 0 1 0 12 9Z M12 11.5L12.9 13.3L14.8 13.6L13.4 14.9L13.8 16.8L12 15.9L10.2 16.8L10.6 14.9L9.2 13.6L11.1 13.3Z"/>',
  other: '<path d="M6 21V4 M6 4H17L15 8L17 12H6"/>',
}

export function initMilestones() {
  document.querySelectorAll('.ms-group').forEach((group) => {
    const icon = ICONS[group.dataset.kind] ?? ICONS.other
    const items = group.querySelectorAll('.ms-item')
    items.forEach((item) => {
      item.querySelector('.ms-link, .ms-card')?.insertAdjacentHTML('afterbegin',
        `<span class="ms-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${icon}</svg></span>`)
    })
    group.querySelector('.ms-count')?.append(String(items.length).padStart(2, '0'))
  })
}
