// ─── Milestones ───────────────────────────────────────────────────────────────
// Each .ms-group[data-kind] is a glass case: every item gets its object (by
// kind) standing on a plinth above its plaque, the label gets a count, and a
// ghost "more to come" slot is added at the end. Adding a milestone = adding
// one <li> to the right group; a new kind just needs an object below.

const PLINTH = '<rect class="ms-d" x="8" y="31" width="16" height="6"/>'

const OBJECTS = {
  hackathon: `
    <path class="ms-l" d="M9 6H5.5V9.5C5.5 11.8 7 13.2 9.4 13.4 M23 6H26.5V9.5C26.5 11.8 25 13.2 22.6 13.4"/>
    <path class="ms-f" d="M9 3H23V11.5C23 16 20 18.5 16 18.5C12 18.5 9 16 9 11.5Z"/>
    <path class="ms-f" d="M14.5 18.5H17.5V25.5H14.5Z M11 25.5H21V28.5H11Z"/>
    <path class="ms-hi" d="M11.75 5.5V11"/>`,
  internship: `
    <path class="ms-l" d="M12.5 12V9H19.5V12"/>
    <path class="ms-f" d="M5 12H27V28.5H5Z"/>
    <path class="ms-l" d="M5 19H27"/>
    <path class="ms-f" d="M14.5 17.5H17.5V20.5H14.5Z"/>`,
  award: `
    <path class="ms-m" d="M10 2H14.5L18 11H13.5Z M22 2H17.5L14 11H18.5Z"/>
    <circle class="ms-f" cx="16" cy="18" r="7"/>
    <circle class="ms-l" cx="16" cy="18" r="4.25"/>
    <path class="ms-l" d="M16 25V31"/>`,
  other: `
    <path class="ms-l" d="M10 3V31"/>
    <path class="ms-f" d="M10 4H25L22 9L25 14H10Z"/>`,
}

const object = (kind) =>
  `<svg class="ms-obj" viewBox="0 0 32 38" aria-hidden="true">${OBJECTS[kind] ?? OBJECTS.other}${PLINTH}</svg>`

export function initMilestones() {
  document.querySelectorAll('.ms-group').forEach((group) => {
    const kind = group.dataset.kind
    const items = group.querySelectorAll('.ms-item')
    items.forEach((item) => {
      item.querySelector('.ms-link, .ms-card')?.insertAdjacentHTML('afterbegin', object(kind))
    })
    group.querySelector('.ms-count')?.append(String(items.length).padStart(2, '0'))
    group.querySelector('.ms-grid')?.insertAdjacentHTML('beforeend', `
      <li class="ms-item is-next" aria-hidden="true">
        <div class="ms-card">${object(kind)}<span class="ms-text"><span class="ms-meta">more to come</span></span></div>
      </li>`)
  })
}
