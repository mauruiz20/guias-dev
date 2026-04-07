const STORAGE_KEY = 'plan-fullstack-2026-progress'
const THEME_KEY = 'plan-fullstack-2026-theme'

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme = saved || (prefersDark ? 'dark' : 'light')
  applyTheme(theme)
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  const btn = document.getElementById('themeToggle')
  if (btn) btn.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'
  localStorage.setItem(THEME_KEY, theme)
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light'
  applyTheme(current === 'dark' ? 'light' : 'dark')
}

const sections = {
  prep: { label: 'Preparacion', el: 'sp-prep' },
  s1: { label: 'Semana 1', el: 'sp-s1' },
  s2: { label: 'Semana 2', el: 'sp-s2' },
  s3: { label: 'Semana 3', el: 'sp-s3' },
  s4: { label: 'Semana 4', el: 'sp-s4' },
  s5: { label: 'Semana 5', el: 'sp-s5' },
  s6: { label: 'Semana 6', el: 'sp-s6' },
}

function loadProgress() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    Object.keys(d).forEach((id) => {
      const cb = document.getElementById(id)
      if (cb) {
        cb.checked = d[id]
        toggleDone(cb)
      }
    })
  } catch (e) {}
}

function saveProgress() {
  const d = {}
  document.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    if (cb.id && cb.id.startsWith('cb-')) d[cb.id] = cb.checked
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
}

function toggleDone(cb) {
  const ci = cb.closest('.ci')
  if (ci) ci.classList.toggle('done', cb.checked)
}

function updateProgress() {
  const all = document.querySelectorAll('input[type="checkbox"][id^="cb-"]')
  const checked = [...all].filter((c) => c.checked).length
  const total = all.length
  const pct = total ? Math.round((checked / total) * 100) : 0

  document.getElementById('globalBar').style.width = pct + '%'
  document.getElementById('globalPercent').textContent = pct + '%'
  document.getElementById('globalCount').textContent =
    checked + ' / ' + total + ' completados'

  Object.keys(sections).forEach((key) => {
    const cbs = document.querySelectorAll(
      '[data-section="' + key + '"] input[type="checkbox"]'
    )
    const done = [...cbs].filter((c) => c.checked).length
    const t = cbs.length
    const sp = document.getElementById(sections[key].el)
    if (sp && t > 0) sp.textContent = done + '/' + t
  })
}

function resetProgress() {
  if (
    confirm('¿Estas seguro? Se borraran todos los checkboxes marcados.')
  ) {
    localStorage.removeItem(STORAGE_KEY)
    document.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = false
      toggleDone(cb)
    })
    updateProgress()
  }
}

function linkifyUrls() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  )
  const urlRegex = /(https?:\/\/[^\s<),]+)/g
  const nodes = []
  while (walker.nextNode()) {
    if (urlRegex.test(walker.currentNode.textContent)) {
      nodes.push(walker.currentNode)
    }
    urlRegex.lastIndex = 0
  }
  nodes.forEach((node) => {
    const parent = node.parentNode
    if (parent.tagName === 'A' || parent.tagName === 'SCRIPT') return
    const frag = document.createDocumentFragment()
    let last = 0
    node.textContent.replace(urlRegex, (match, url, offset) => {
      if (offset > last) {
        frag.appendChild(document.createTextNode(node.textContent.slice(last, offset)))
      }
      const a = document.createElement('a')
      a.href = url
      a.textContent = url
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      frag.appendChild(a)
      last = offset + match.length
    })
    if (last < node.textContent.length) {
      frag.appendChild(document.createTextNode(node.textContent.slice(last)))
    }
    parent.replaceChild(frag, node)
  })
}

function setupSectionNav() {
  const navChips = document.querySelectorAll('.nav-chip')
  const sectionIds = [...navChips].map((chip) => chip.getAttribute('data-nav'))
  const stickyHeight = document.getElementById('globalProgress').offsetHeight

  // Smooth scroll with offset for sticky header
  navChips.forEach((chip) => {
    chip.addEventListener('click', (e) => {
      e.preventDefault()
      const target = document.getElementById(chip.getAttribute('data-nav'))
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - stickyHeight - 12
        window.scrollTo({ top, behavior: 'smooth' })
      }
    })
  })

  // Highlight active section on scroll
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navChips.forEach((c) => c.classList.remove('active'))
          const active = document.querySelector(`.nav-chip[data-nav="${entry.target.id}"]`)
          if (active) active.classList.add('active')
        }
      })
    },
    { rootMargin: `-${stickyHeight + 20}px 0px -60% 0px` }
  )

  sectionIds.forEach((id) => {
    const el = document.getElementById(id)
    if (el) observer.observe(el)
  })
}

// Apply theme before DOMContentLoaded to avoid flash
initTheme()

document.addEventListener('DOMContentLoaded', () => {
  linkifyUrls()
  loadProgress()
  updateProgress()
  setupSectionNav()

  document.getElementById('themeToggle').addEventListener('click', toggleTheme)

  document.addEventListener('change', (e) => {
    if (
      e.target.type === 'checkbox' &&
      e.target.id &&
      e.target.id.startsWith('cb-')
    ) {
      toggleDone(e.target)
      saveProgress()
      updateProgress()
    }
  })
})
