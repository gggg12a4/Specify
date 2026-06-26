/**
 * Detect @mention query at cursor in plain text.
 * Returns { query, start, end } or null.
 */
export function detectMention(text, cursorPos) {
  const before = text.slice(0, cursorPos)
  const match = before.match(/@([\w./_\u4e00-\u9fff-]*)$/)
  if (!match) return null
  return {
    query: match[1],
    start: cursorPos - match[0].length,
    end: cursorPos,
  }
}

/**
 * Approximate caret pixel position inside a textarea (monospace).
 */
export function getTextareaCaretCoords(textarea, cursorPos) {
  if (!textarea) return { top: 0, left: 0 }

  const style = window.getComputedStyle(textarea)
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.7
  const paddingTop = parseFloat(style.paddingTop) || 0
  const paddingLeft = parseFloat(style.paddingLeft) || 0
  const fontSize = parseFloat(style.fontSize) || 13
  const charWidth = fontSize * 0.6

  const textBefore = textarea.value.slice(0, cursorPos)
  const lines = textBefore.split('\n')
  const lineIndex = lines.length - 1
  const colIndex = lines[lineIndex].length

  return {
    top: paddingTop + lineIndex * lineHeight + lineHeight + 4,
    left: paddingLeft + colIndex * charWidth,
  }
}

export function buildMentionInsertText(item) {
  const raw = String(item.value || item.label || '').replace(/^@/, '')
  return `@${raw}`
}

export function filterMentionItems(items, query) {
  const q = query.toLowerCase()
  if (!q) return items
  return items.filter((item) => {
    const label = String(item.label || '').toLowerCase()
    const value = String(item.value || '').toLowerCase()
    return label.includes(q) || value.includes(q)
  })
}
