const profile = document.querySelector('.bio-profile')
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

if (profile && !reducedMotion.matches) {
  const portrait = profile.querySelector('.bio-portrait')
  const links = profile.querySelector('.social-links')

  // Wait until the links are visible so the entrance also plays on mobile.
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return
    observer.disconnect()
    if (reducedMotion.matches) return

    const photo = portrait.getBoundingClientRect()
    const originX = photo.left + photo.width / 2
    const originY = photo.bottom - photo.height * 0.22

    links.querySelectorAll('a').forEach((link, index) => {
      const destination = link.getBoundingClientRect()
      const offsetX = originX - (destination.left + destination.width / 2)
      const offsetY = originY - (destination.top + destination.height / 2)
      const animation = link.animate([
        { transform: `translate(${offsetX}px, ${offsetY}px) scale(0.65)`, opacity: 0 },
        { transform: 'translate(0, 5px) scale(1.04)', opacity: 1, offset: 0.8 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      ], {
        duration: 750,
        delay: 120 + index * 90,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'backwards',
      })

      // Keep keyboard navigation immediate while the entrance is running.
      link.addEventListener('focus', () => animation.cancel(), { once: true })
      reducedMotion.addEventListener('change', () => {
        if (reducedMotion.matches) animation.cancel()
      }, { once: true })
    })
  }, { threshold: 0.15 })

  observer.observe(links)
}
