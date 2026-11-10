import './styles/main.css'

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

// Mobile menu toggle
const mobileMenuButton = document.getElementById('mobile-menu-button')
const mobileMenu = document.getElementById('mobile-menu')

mobileMenuButton?.addEventListener('click', () => {
  const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true'
  mobileMenuButton.setAttribute('aria-expanded', String(!isExpanded))
  mobileMenu?.classList.toggle('hidden')
})

// Close mobile menu when clicking on a link
const mobileNavLinks = mobileMenu?.querySelectorAll('a')
mobileNavLinks?.forEach((link) => {
  link.addEventListener('click', () => {
    mobileMenu?.classList.add('hidden')
    mobileMenuButton?.setAttribute('aria-expanded', 'false')
  })
})

// Navbar scroll effect
const navbar = document.getElementById('navbar')

const handleScroll = () => {
  const currentScrollY = window.scrollY

  if (navbar) {
    if (currentScrollY > 50) {
      navbar.classList.add('bg-[#0f172a]/95', 'backdrop-blur-md', 'shadow-lg')
    } else {
      navbar.classList.remove('bg-[#0f172a]/95', 'backdrop-blur-md', 'shadow-lg')
    }
  }
}

window.addEventListener('scroll', handleScroll, { passive: true })

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
    const oldSection = window.location.hash.match(/^#(experience|talks|projects)$/)
    if (oldSection) {
      window.location.replace(`/${oldSection[1]}/${window.location.search}`)
    }
  }

  redirectToSection()
  window.addEventListener('hashchange', redirectToSection)
}

console.log('Personal website loaded successfully!')
