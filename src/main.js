import './styles/main.css'

const FALLBACK_PATHS = {
  blog: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
  image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
}

const createFallbackSvg = (kind) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', 'w-12 h-12 text-gray-600')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('viewBox', '0 0 24 24')

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('stroke-linejoin', 'round')
  path.setAttribute('stroke-width', '2')
  path.setAttribute('d', FALLBACK_PATHS[kind])

  svg.appendChild(path)
  return svg
}

const renderImageFallback = (img) => {
  const parent = img.parentElement
  if (!parent) return
  if (parent.dataset.fallbackRendered === 'true') return

  parent.dataset.fallbackRendered = 'true'
  img.remove()

  const kind = img.dataset.fallback === 'blog' ? 'blog' : 'image'

  if (kind === 'blog') {
    const wrapper = document.createElement('div')
    wrapper.className = 'flex flex-col items-center gap-2'
    wrapper.appendChild(createFallbackSvg('blog'))

    const label = document.createElement('span')
    label.className = 'text-gray-500 text-sm'
    label.textContent = img.dataset.fallbackLabel ?? 'Preview'
    wrapper.appendChild(label)

    parent.appendChild(wrapper)
    return
  }

  parent.appendChild(createFallbackSvg('image'))
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

// Active section highlighting
const sections = document.querySelectorAll('section[id]')
const navLinks = document.querySelectorAll('.nav-link[href^="#"]')

const setActiveLink = (id) => {
  if (!id) return
  navLinks.forEach((link) => {
    link.classList.remove('nav-link-active')
    if (link.getAttribute('href') === `#${id}`) {
      link.classList.add('nav-link-active')
    }
  })
}

const setActiveLinkForBottom = () => {
  if (!navLinks.length) return
  const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 2
  if (atBottom) {
    setActiveLink('about')
  }
}

const setActiveLinkFromScroll = () => {
  if (!sections.length) return
  const probeY = window.scrollY + window.innerHeight * 0.35
  let activeId = null

  sections.forEach((section) => {
    const top = section.offsetTop
    const bottom = top + section.offsetHeight
    if (probeY >= top && probeY < bottom) {
      activeId = section.getAttribute('id')
    }
  })

  if (activeId) {
    setActiveLink(activeId)
  }
}

const handleScroll = () => {
  const currentScrollY = window.scrollY

  if (navbar) {
    if (currentScrollY > 50) {
      navbar.classList.add('bg-[#0f172a]/95', 'backdrop-blur-md', 'shadow-lg')
    } else {
      navbar.classList.remove('bg-[#0f172a]/95', 'backdrop-blur-md', 'shadow-lg')
    }
  }

  setActiveLinkFromScroll()
  setActiveLinkForBottom()
}

window.addEventListener('scroll', handleScroll, { passive: true })

// Certification Carousel
const certCarousel = document.getElementById('cert-carousel')
const certPrevBtn = document.getElementById('cert-prev')
const certNextBtn = document.getElementById('cert-next')

if (certCarousel && certPrevBtn && certNextBtn) {
  const certSection = document.getElementById('certifications')
  const certCards = Array.from(certCarousel.querySelectorAll('.cert-card'))
  let useTransformFallback = false

  const getGap = () => {
    const styles = window.getComputedStyle(certCarousel)
    return parseFloat(styles.columnGap || styles.gap || '0') || 0
  }

  const getMetrics = () => {
    const frame = certCarousel.parentElement
    const configuredVisible = frame
      ? Math.max(1, parseInt(window.getComputedStyle(frame).getPropertyValue('--cert-visible') || '4', 10))
      : 4

    const firstCard = certCards[0]
    if (!firstCard) {
      return {
        step: certCarousel.clientWidth || 1,
        visibleCards: 1,
        maxIndex: 0,
      }
    }

    const measuredCardWidth = firstCard.getBoundingClientRect().width
    const fallbackCardWidth = certCarousel.clientWidth > 0 ? certCarousel.clientWidth / configuredVisible : 0
    const cardWidth = measuredCardWidth > 0 ? measuredCardWidth : fallbackCardWidth
    const step = Math.max(1, cardWidth + getGap())
    const inferredVisible = Math.max(1, Math.floor((certCarousel.clientWidth + getGap()) / step))
    const visibleCards = Math.max(1, Math.min(configuredVisible, inferredVisible, certCards.length))
    const maxIndex = Math.max(0, certCards.length - visibleCards)

    return { step, visibleCards, maxIndex }
  }

  let currentIndex = 0

  const updateCurrentIndexFromScroll = () => {
    if (useTransformFallback) return

    const { step, maxIndex } = getMetrics()
    if (!step) {
      currentIndex = 0
      return
    }

    currentIndex = Math.max(0, Math.min(maxIndex, Math.round(certCarousel.scrollLeft / step)))
  }

  const updateButtonStates = () => {
    const { maxIndex } = getMetrics()
    certPrevBtn.disabled = currentIndex <= 0
    certNextBtn.disabled = currentIndex >= maxIndex
  }

  const applyTransformOffset = (left, behavior = 'smooth') => {
    certCarousel.style.willChange = 'transform'
    certCarousel.style.transition = behavior === 'smooth' ? 'transform 260ms ease' : 'none'
    certCarousel.style.transform = `translate3d(${-left}px, 0, 0)`
  }

  const setCarouselPosition = (targetIndex, behavior = 'smooth') => {
    const { step, maxIndex } = getMetrics()
    const nextIndex = Math.max(0, Math.min(maxIndex, targetIndex))
    currentIndex = nextIndex
    const left = nextIndex * step

    if (useTransformFallback) {
      applyTransformOffset(left, behavior)
      updateButtonStates()
      return
    }

    if (typeof certCarousel.scrollTo === 'function') {
      try {
        certCarousel.scrollTo({ left, behavior })
      } catch {
        certCarousel.scrollLeft = left
      }
    } else {
      certCarousel.scrollLeft = left
    }

    window.setTimeout(() => {
      const canActuallyScroll = certCarousel.scrollWidth - certCarousel.clientWidth > 1
      if (!canActuallyScroll && left > 0) {
        useTransformFallback = true
        applyTransformOffset(left, behavior)
      }

      updateCurrentIndexFromScroll()
      updateButtonStates()
    }, 260)
  }

  const scrollCerts = (direction) => {
    const { visibleCards } = getMetrics()
    setCarouselPosition(currentIndex + direction * visibleCards)
  }

  certPrevBtn.addEventListener('click', () => scrollCerts(-1))
  certNextBtn.addEventListener('click', () => scrollCerts(1))

  certCarousel.addEventListener(
    'scroll',
    () => {
      updateCurrentIndexFromScroll()
      updateButtonStates()
    },
    { passive: true }
  )
  window.addEventListener(
    'resize',
    () => {
      setCarouselPosition(currentIndex, 'auto')
    },
    { passive: true }
  )

  window.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return

    const target = event.target
    const isTextInput =
      target instanceof HTMLElement &&
      (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
    if (isTextInput) return

    if (certSection) {
      const sectionRect = certSection.getBoundingClientRect()
      const isInView = sectionRect.top < window.innerHeight && sectionRect.bottom > 0
      if (!isInView) return
    }

    event.preventDefault()
    scrollCerts(event.key === 'ArrowLeft' ? -1 : 1)
  })

  // Initial state
  updateCurrentIndexFromScroll()
  updateButtonStates()
  window.requestAnimationFrame(() => {
    updateCurrentIndexFromScroll()
    updateButtonStates()
  })
}

setActiveLinkFromScroll()

// Fade in animation on scroll
const fadeElements = document.querySelectorAll('.fade-in')

const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('opacity-100', 'translate-y-0')
        entry.target.classList.remove('opacity-0', 'translate-y-4')
      }
    })
  },
  { threshold: 0.1 }
)

fadeElements.forEach((el) => fadeObserver.observe(el))

console.log('Personal website loaded successfully!')
