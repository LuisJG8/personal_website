const galleries = {
  'fiu-codex-workshop': {
    title: 'Codex Community Workshop Miami - FIU',
    photos: [
      'Presenting Codex and Sites beside the OpenAI banner at FIU',
      'Students following the workshop with their laptops',
      'A view of the Codex presentation from the classroom',
      'The presenter and students during the FIU Codex workshop',
    ].map((alt, index) => {
      const filename = `/images/events/fiu-codex-workshop/photo-${String(index + 1).padStart(2, '0')}`
      return { src: `${filename}.jpg`, thumbnail: `${filename}-thumb.jpg`, alt }
    }),
  },
  'devday-miami': {
    title: 'DevDay Exchange Community Hackathon: Miami',
    photos: [
      'Attendees working together at The LAB Miami',
      'The LAB Miami entrance with an OpenAI event banner',
      'Refreshments and stickers ready for attendees',
      'DevDay Exchange event display in the lounge',
      'OpenAI event hats, tote bags, and stickers',
      'A selfie beside the DevDay Exchange event display',
      'Welcome table with event giveaways and community flyers',
      'A presenter at the laptop in front of the event screen',
      'Attendees sharing a laptop during the hackathon',
      'Teams building projects together with Codex',
      'Working on a laptop at the event',
    ].map((alt, index) => {
      const filename = `/images/events/devday-miami/photo-${String(index + 1).padStart(2, '0')}`
      return { src: `${filename}.jpg`, thumbnail: `${filename}-thumb.jpg`, alt }
    }),
  },
}

const dialog = document.getElementById('event-gallery')

if (dialog) {
  const image = dialog.querySelector('#gallery-image')
  const title = dialog.querySelector('#gallery-title')
  const count = dialog.querySelector('#gallery-count')
  const thumbnails = dialog.querySelector('#gallery-thumbnails')
  let gallery
  let currentIndex = 0
  let trigger

  const showPhoto = (index) => {
    currentIndex = (index + gallery.photos.length) % gallery.photos.length
    const photo = gallery.photos[currentIndex]
    image.src = photo.src
    image.alt = photo.alt
    count.textContent = `Picture ${currentIndex + 1} of ${gallery.photos.length}`

    Array.from(thumbnails.children).forEach((button, index) => {
      if (index === currentIndex) button.setAttribute('aria-current', 'true')
      else button.removeAttribute('aria-current')
    })

    const selected = thumbnails.children[currentIndex]
    const left = selected.offsetLeft - thumbnails.offsetLeft
    if (left < thumbnails.scrollLeft || left + selected.offsetWidth > thumbnails.scrollLeft + thumbnails.clientWidth) {
      thumbnails.scrollTo({ left: left - (thumbnails.clientWidth - selected.offsetWidth) / 2 })
    }
  }

  document.querySelectorAll('[data-event-gallery]').forEach((button) => {
    button.addEventListener('click', () => {
      gallery = galleries[button.dataset.eventGallery]
      if (!gallery) return
      trigger = button
      title.textContent = gallery.title
      thumbnails.replaceChildren(...gallery.photos.map((photo, index) => {
        const thumbnail = document.createElement('button')
        thumbnail.type = 'button'
        thumbnail.className = 'gallery-thumbnail'
        thumbnail.setAttribute('aria-label', `Show picture ${index + 1}: ${photo.alt}`)
        const preview = document.createElement('img')
        preview.src = photo.thumbnail
        preview.alt = ''
        preview.draggable = false
        preview.width = 96
        preview.height = 64
        preview.loading = 'lazy'
        preview.decoding = 'async'
        thumbnail.append(preview)
        thumbnail.addEventListener('click', () => showPhoto(index))
        return thumbnail
      }))
      dialog.showModal()
      document.documentElement.classList.add('gallery-open')
      thumbnails.scrollLeft = 0
      showPhoto(0)
    })
  })

  dialog.querySelector('[data-gallery-previous]').addEventListener('click', () => showPhoto(currentIndex - 1))
  dialog.querySelector('[data-gallery-next]').addEventListener('click', () => showPhoto(currentIndex + 1))
  dialog.querySelector('[data-gallery-close]').addEventListener('click', () => dialog.close())

  dialog.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      showPhoto(currentIndex + (event.key === 'ArrowLeft' ? -1 : 1))
    }
  })

  // Native dialog behavior handles Escape and keeps keyboard focus inside the viewer.
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return
    const bounds = dialog.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close()
  })

  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('gallery-open')
    trigger?.focus({ preventScroll: true })
  })
}
