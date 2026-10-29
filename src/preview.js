// ─── Project rows: index numbers ──────────────────────────────────────────────

export function initProjectRows() {
  document.querySelectorAll('.proj-item').forEach((item, i) => {
    const idx = item.querySelector('.proj-item-idx')
    if (idx) idx.textContent = String(i + 1).padStart(2, '0')
  })
}
