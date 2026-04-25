import { prepareWithSegments, layoutWithLines } from 'https://esm.sh/@chenglou/pretext@0.0.6'

function canvasFont(el) {
  const s = getComputedStyle(el)
  return `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`
}

function letterSpacingPx(el) {
  const s = getComputedStyle(el)
  const raw = s.letterSpacing
  if (!raw || raw === 'normal') return 0
  if (raw.endsWith('em')) return parseFloat(raw) * parseFloat(s.fontSize)
  return parseFloat(raw) || 0
}

function lineHeightPx(el) {
  const s = getComputedStyle(el)
  const raw = s.lineHeight
  if (!raw || raw === 'normal') return parseFloat(s.fontSize) * 1.2
  return parseFloat(raw)
}

// Wrap each pretext-computed line in a clip container for slide-up reveal
async function revealTitle(el, startDelayMs = 80) {
  const text = el.textContent.trim()
  const font = canvasFont(el)
  const lh = lineHeightPx(el)
  const ls = letterSpacingPx(el)

  const prepared = prepareWithSegments(text, font, { letterSpacing: ls })
  const { lines } = layoutWithLines(prepared, el.offsetWidth || 600, lh)

  el.innerHTML = lines
    .map((line, i) => {
      const delay = startDelayMs + i * 130
      return `<span class="t-clip"><span class="t-inner" style="animation-delay:${delay}ms">${line.text}</span></span>`
    })
    .join('\n')
}

function scheduleReveal(el, delayMs) {
  if (!el) return
  el.classList.add('t-fade')
  el.style.animationDelay = `${delayMs}ms`
}

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for Nunito to be ready — pretext uses canvas, font must be loaded
  await document.fonts.ready

  const title    = document.querySelector('.home__title')
  const subtitle = document.querySelector('.home__subtitle')
  const descs    = document.querySelectorAll('.home__description')
  const buttons  = document.querySelector('.home__buttons')
  const footer   = document.querySelector('.home__footer')

  // 1. Subtitle fades in first
  scheduleReveal(subtitle, 0)

  // 2. Title: line-by-line clip reveal — pretext computes exact line breaks
  if (title) {
    title.style.visibility = 'hidden'
    await revealTitle(title, 180)
    title.style.visibility = ''
  }

  // 3. Descriptions stagger after title
  descs.forEach((el, i) => scheduleReveal(el, 520 + i * 140))

  // 4. Buttons pop in last
  scheduleReveal(buttons, 820)

  // 5. Footer slides up
  scheduleReveal(footer, 960)
})
