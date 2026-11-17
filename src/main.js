import './styles/main.css'
import './event-gallery.js'
import './social-links.js'

const createFallbackSvg = () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', 'w-12 h-12 text-gray-600')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('viewBox', '0 0 24 24')

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('stroke-linejoin', 'round')
  path.setAttribute('stroke-width', '2')
  path.setAttribute('d', 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z')

  svg.appendChild(path)
  return svg
}

const renderImageFallback = (img) => {
  const parent = img.parentElement
  if (!parent) return
  if (parent.dataset.fallbackRendered === 'true') return

  parent.dataset.fallbackRendered = 'true'
  img.remove()

  parent.appendChild(createFallbackSvg())
}

document.querySelectorAll('img[data-fallback]').forEach((img) => {
  img.addEventListener('error', () => renderImageFallback(img), { once: true })
})

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle')
const moonIcon = document.getElementById('theme-icon-moon')
const sunIcon = document.getElementById('theme-icon-sun')

const getStoredTheme = () => {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  // Check system preference
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

const applyTheme = (theme) => {
  const html = document.documentElement

  if (theme === 'light') {
    html.classList.add('light')
    moonIcon?.classList.add('hidden')
    sunIcon?.classList.remove('hidden')
  } else {
    html.classList.remove('light')
    moonIcon?.classList.remove('hidden')
    sunIcon?.classList.add('hidden')
  }

  localStorage.setItem('theme', theme)
}

// Initialize theme
applyTheme(getStoredTheme())

themeToggle?.addEventListener('click', () => {
  const currentTheme = document.documentElement.classList.contains('light') ? 'light' : 'dark'
  applyTheme(currentTheme === 'light' ? 'dark' : 'light')
})

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    applyTheme(e.matches ? 'light' : 'dark')
  }
})

// One navigation tree adapts to its available width, including enlarged text.
const navbar = document.getElementById('navbar')
const navRow = navbar?.querySelector('.nav-row')
const navLinks = document.getElementById('primary-links')
const menuButton = document.getElementById('mobile-menu-button')
const nativePopover = 'popover' in HTMLElement.prototype

if (navbar && navRow && navLinks && menuButton) {
  let previousWidth = 0
  const isOpen = () => nativePopover ? navLinks.matches(':popover-open') : navLinks.hasAttribute('data-open')
  const updateNavigation = () => {
    const width = navRow.clientWidth
    if (!navbar.classList.contains('is-wide') && width <= previousWidth) return
    previousWidth = width
    const wasOpen = isOpen()
    navbar.classList.add('is-measuring', 'is-wide')
    navLinks.removeAttribute('popover')
    const fits = navRow.scrollWidth <= width
    navbar.classList.toggle('is-wide', fits)
    if (!fits && nativePopover) {
      navLinks.setAttribute('popover', 'auto')
      if (wasOpen) navLinks.showPopover()
    }
    if (fits) navLinks.removeAttribute('data-open')
    menuButton.setAttribute('aria-expanded', String(!fits && wasOpen))
    requestAnimationFrame(() => navbar.classList.remove('is-measuring'))
  }

  if (nativePopover) {
    navLinks.addEventListener('toggle', (event) => menuButton.setAttribute('aria-expanded', String(event.newState === 'open')))
  } else {
    // Older browsers retain the same links as a simple disclosure.
    navLinks.removeAttribute('popover')
    menuButton.addEventListener('click', () => {
      const open = navLinks.toggleAttribute('data-open')
      menuButton.setAttribute('aria-expanded', String(open))
    })
    document.addEventListener('click', (event) => {
      if (!navbar.contains(event.target)) {
        navLinks.removeAttribute('data-open')
        menuButton.setAttribute('aria-expanded', 'false')
      }
    })
    navbar.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        navLinks.removeAttribute('data-open')
        menuButton.setAttribute('aria-expanded', 'false')
        menuButton.focus()
      }
    })
  }
  const observer = new ResizeObserver(updateNavigation)
  observer.observe(navRow)
  observer.observe(navLinks)
  updateNavigation()
}

// Switch between hosted events and speaking appearances.
const talkFilters = document.querySelectorAll('#talk-filters button')

talkFilters.forEach((button) => {
  button.addEventListener('click', () => {
    talkFilters.forEach((filter) => {
      const isSelected = filter === button
      filter.setAttribute('aria-pressed', String(isSelected))
      document.getElementById(filter.getAttribute('aria-controls')).hidden = !isSelected
    })
  })
})

// Keep links to the original homepage sections working.
if (document.getElementById('hero')) {
  const redirectToSection = () => {
    const oldSection = window.location.hash.match(/^#(experience|talks|projects|blog)$/)
    if (oldSection) {
      window.location.replace(`/${oldSection[1]}/${window.location.search}`)
    }
  }

  redirectToSection()
  window.addEventListener('hashchange', redirectToSection)
}

console.log('Personal website loaded successfully!')

// Load the live 3D experiment only on the page that contains it.
const galtonEmbed = document.querySelector('[data-galton-embed]')
if (galtonEmbed) {
  import('./galton/embed.ts')
    .then(({ mountGaltonBoard }) => {
      const dispose = mountGaltonBoard(galtonEmbed)
      window.addEventListener('pagehide', (event) => { if (!event.persisted) dispose() })
    })
    .catch((error) => {
      console.error('Could not load the Galton experiment.', error)
      galtonEmbed.querySelector('[data-galton-canvas]').textContent = 'The board could not load. Try refreshing the page.'
    })
}
