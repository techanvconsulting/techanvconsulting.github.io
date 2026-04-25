import { prepareWithSegments, layoutWithLines } from 'https://esm.sh/@chenglou/pretext@0.0.6'

/*──────────────────────────────────────────────
  Font helpers — feed real computed values to
  pretext so canvas measurement matches CSS
──────────────────────────────────────────────*/
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

/*──────────────────────────────────────────────
  Pretext title reveal
  — layoutWithLines gives exact per-line strings
  — each line split into .t-word spans for hover
  — clip overflow removed once last line lands
──────────────────────────────────────────────*/
async function revealTitle(el, startDelayMs = 80) {
  const text = el.textContent.trim()
  const font = canvasFont(el)
  const lh   = lineHeightPx(el)
  const ls   = letterSpacingPx(el)

  const prepared = prepareWithSegments(text, font, { letterSpacing: ls })
  const { lines } = layoutWithLines(prepared, el.offsetWidth || 600, lh)

  el.innerHTML = lines
    .map((line, i) => {
      const delay = startDelayMs + i * 130
      const words = line.text
        .split(' ')
        .map((w, wi) =>
          `<span class="t-word" style="--wi:${i * 10 + wi}">${w}</span>`
        )
        .join(' ')
      return `<span class="t-clip"><span class="t-inner" style="animation-delay:${delay}ms">${words}</span></span>`
    })
    .join('\n')

  // Once the last line finishes its clip animation, open overflow
  // so .t-word:hover can translateY freely
  const inners = el.querySelectorAll('.t-inner')
  const last   = inners[inners.length - 1]
  if (last) {
    last.addEventListener('animationend', () => {
      el.querySelectorAll('.t-clip').forEach(c => (c.style.overflow = 'visible'))
    }, { once: true })
  }
}

/*──────────────────────────────────────────────
  Cursor spotlight
  — tracks mouse inside .home, paints a warm
    radial glow via CSS custom properties
──────────────────────────────────────────────*/
function initSpotlight() {
  const hero = document.querySelector('.home')
  if (!hero) return

  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect()
    hero.style.setProperty('--cx', `${e.clientX - r.left}px`)
    hero.style.setProperty('--cy', `${e.clientY - r.top}px`)
  })

  hero.addEventListener('mouseleave', () => {
    hero.style.setProperty('--cx', '50%')
    hero.style.setProperty('--cy', '50%')
  })
}

/*──────────────────────────────────────────────
  Magnetic buttons
  — button follows cursor within its bounds
  — snaps back with spring easing on leave
──────────────────────────────────────────────*/
function initMagnetic(selector) {
  document.querySelectorAll(selector).forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r  = btn.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width  / 2)) * 0.32
      const dy = (e.clientY - (r.top  + r.height / 2)) * 0.32
      btn.style.transform = `translate(${dx}px, ${dy}px)`
    })
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = ''
    })
  })
}

/*──────────────────────────────────────────────
  Tilt card — subtle 3-D perspective tilt
  on the hero data block as cursor moves
──────────────────────────────────────────────*/
function initTilt() {
  const data = document.querySelector('.home__data')
  const hero = document.querySelector('.home')
  if (!data || !hero) return

  hero.addEventListener('mousemove', (e) => {
    const r  = hero.getBoundingClientRect()
    const nx = ((e.clientX - r.left) / r.width  - 0.5) * 2   // -1 to 1
    const ny = ((e.clientY - r.top)  / r.height - 0.5) * 2

    const rx =  ny * 3   // pitch
    const ry = -nx * 3   // yaw
    data.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`
  })

  hero.addEventListener('mouseleave', () => {
    data.style.transform = ''
  })
}

/*──────────────────────────────────────────────
  Stagger fade-up for non-title elements
──────────────────────────────────────────────*/
function scheduleReveal(el, delayMs) {
  if (!el) return
  el.classList.add('t-fade')
  el.style.animationDelay = `${delayMs}ms`
}

/*──────────────────────────────────────────────
  Init
──────────────────────────────────────────────*/
document.addEventListener('DOMContentLoaded', async () => {
  await document.fonts.ready

  const title    = document.querySelector('.home__title')
  const subtitle = document.querySelector('.home__subtitle')
  const descs    = document.querySelectorAll('.home__description')
  const buttons  = document.querySelector('.home__buttons')
  const footer   = document.querySelector('.home__footer')

  scheduleReveal(subtitle, 0)

  if (title) {
    title.style.visibility = 'hidden'
    await revealTitle(title, 180)
    title.style.visibility = ''
  }

  descs.forEach((el, i) => scheduleReveal(el, 520 + i * 140))
  scheduleReveal(buttons, 820)
  scheduleReveal(footer, 960)

  initSpotlight()
  initMagnetic('.home__button')
  initTilt()
})
