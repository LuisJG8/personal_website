export const BOARD = {
  width: 560,
  height: 900,
  inset: 40,
  top: 60,
  bottom: 852,
  binTop: 548,
  rows: 14,
  bins: 15,
  ballCount: 72,
  ballRadius: 3.5,
  pegRadius: 2.5,
}

const binWidth = (BOARD.width - BOARD.inset * 2) / BOARD.bins
const pegs = Array.from({ length: BOARD.rows }, (_, row) => {
  return Array.from({ length: row + 1 }, (_, column) => ({
    x: BOARD.width / 2 + binWidth * (column - row / 2),
    y: 244 + row * 21.5,
  }))
}).flat()

const dividers = Array.from({ length: BOARD.bins - 1 }, (_, column) => {
  const x = BOARD.inset + (column + 1) * binWidth
  return { x, top: BOARD.binTop, bottom: BOARD.bottom }
})

const chamber = [
  { y: BOARD.top, halfWidth: 88 },
  { y: 190, halfWidth: 10 },
  { y: 218, halfWidth: 10 },
  { y: BOARD.binTop, halfWidth: BOARD.width / 2 - BOARD.inset },
  { y: BOARD.bottom, halfWidth: BOARD.width / 2 - BOARD.inset },
]

const chamberHalfWidth = (y) => {
  for (let segment = 1; segment < chamber.length; segment += 1) {
    const start = chamber[segment - 1]
    const end = chamber[segment]
    if (y <= end.y) {
      const progress = Math.max(0, (y - start.y) / (end.y - start.y))
      return start.halfWidth + (end.halfWidth - start.halfWidth) * progress
    }
  }
  return chamber[chamber.length - 1].halfWidth
}

// A fixed-size physics model keeps the same behavior at every screen size.
export class GaltonSimulation {
  constructor(random = Math.random) {
    this.random = random
    this.gravity = 1
    const counts = Array(BOARD.bins).fill(0)
    this.balls = Array.from({ length: BOARD.ballCount }, () => {
      let bin = 0
      for (let choice = 0; choice < BOARD.rows; choice += 1) {
        if (random() > 0.5) bin += 1
      }
      const position = counts[bin]++
      return {
        x: BOARD.inset + (bin + 0.5) * binWidth + (position % 4 - 1.5) * 7.5,
        y: BOARD.bottom - BOARD.ballRadius - Math.floor(position / 4) * 7.5,
        vx: 0,
        vy: 0,
        stillTime: 0,
        stuckTime: 0,
        motion: 0,
        previousX: 0,
        previousY: 0,
        settled: true,
      }
    })
  }

  get settledCount() {
    return this.balls.filter((ball) => ball.settled).length
  }

  flip() {
    if (this.settledCount !== BOARD.ballCount) return false
    this.gravity *= -1
    for (const ball of this.balls) {
      ball.settled = false
      ball.vx = (this.random() - 0.5) * 12
      ball.vy = 0
      ball.stillTime = 0
      ball.stuckTime = 0
      ball.motion = 100
    }
    return true
  }

  collideWithPoint(ball, x, y, radius) {
    const dx = ball.x - x
    const dy = ball.y - y
    const distance = Math.hypot(dx, dy)
    const separation = BOARD.ballRadius + radius
    if (distance >= separation) return

    const nx = distance > 0 ? dx / distance : 1
    const ny = distance > 0 ? dy / distance : 0
    ball.x += nx * (separation - distance)
    ball.y += ny * (separation - distance)
    const speed = ball.vx * nx + ball.vy * ny
    if (speed < 0) {
      ball.vx -= 1.4 * speed * nx
      ball.vy -= 1.4 * speed * ny
    }
    // A tiny sideways nudge prevents a perfectly centered ball balancing on a peg.
    if (Math.abs(nx) < 0.15 && ny * this.gravity < 0) {
      ball.vx += this.random() > 0.5 ? 12 : -12
    }
  }

  constrain(ball) {
    const halfWidth = chamberHalfWidth(ball.y) - BOARD.ballRadius
    const center = BOARD.width / 2
    if (Math.abs(ball.x - center) > halfWidth) {
      const side = Math.sign(ball.x - center)
      ball.x = center + side * halfWidth
      ball.vx = -side * Math.abs(ball.vx) * 0.35
    }
    const nearY = BOARD.top + BOARD.ballRadius
    const farY = BOARD.bottom - BOARD.ballRadius
    if (ball.y < nearY || ball.y > farY) {
      ball.y = Math.max(nearY, Math.min(farY, ball.y))
      ball.vy *= -0.12
      ball.vx *= 0.85
    }
  }

  step(dt) {
    for (const ball of this.balls) {
      if (ball.settled) continue
      ball.previousX = ball.x
      ball.previousY = ball.y
      ball.vy += this.gravity * 650 * dt
      ball.vx *= Math.exp(-0.3 * dt)
      ball.x += ball.vx * dt
      ball.y += ball.vy * dt
    }

    for (let iteration = 0; iteration < 3; iteration += 1) {
      for (const ball of this.balls) {
        if (ball.settled) continue
        for (const peg of pegs) {
          this.collideWithPoint(ball, peg.x, peg.y, BOARD.pegRadius)
        }
        for (const divider of dividers) {
          const y = Math.max(divider.top, Math.min(divider.bottom, ball.y))
          this.collideWithPoint(ball, divider.x, y, 0.75)
        }
        this.constrain(ball)
      }

      for (let first = 0; first < this.balls.length; first += 1) {
        const a = this.balls[first]
        for (let second = first + 1; second < this.balls.length; second += 1) {
          const b = this.balls[second]
          if (a.settled && b.settled) continue
          const dx = b.x - a.x
          const dy = b.y - a.y
          const distance = Math.hypot(dx, dy)
          if (distance >= BOARD.ballRadius * 2) continue
          const nx = distance > 0 ? dx / distance : 1
          const ny = distance > 0 ? dy / distance : 0
          const weightA = a.settled ? 0 : 1
          const weightB = b.settled ? 0 : 1
          const weight = weightA + weightB
          const overlap = (BOARD.ballRadius * 2 - distance) / weight
          a.x -= nx * overlap * weightA
          a.y -= ny * overlap * weightA
          b.x += nx * overlap * weightB
          b.y += ny * overlap * weightB
          const speed = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
          if (speed < 0) {
            const impulse = -1.1 * speed / weight
            a.vx -= impulse * nx * weightA
            a.vy -= impulse * ny * weightA
            b.vx += impulse * nx * weightB
            b.vy += impulse * ny * weightB
          }
        }
      }
    }

    for (const ball of this.balls) {
      if (ball.settled) continue
      this.constrain(ball)
      const inCollector = this.gravity > 0 ? ball.y > BOARD.binTop + 20 : ball.y < BOARD.top + 100
      // Contact impulses can jitter even when a ball has stopped moving.
      const movement = Math.hypot(ball.x - ball.previousX, ball.y - ball.previousY) / dt
      const smoothing = Math.exp(-8 * dt)
      ball.motion = ball.motion * smoothing + movement * (1 - smoothing)
      const slow = ball.motion < 8
      ball.stillTime = inCollector && slow ? ball.stillTime + dt : 0
      ball.stuckTime = !inCollector && slow ? ball.stuckTime + dt : 0
      if (ball.stuckTime > 0.6) {
        ball.vx += this.random() > 0.5 ? 35 : -35
        ball.stuckTime = 0
      }
      if (ball.stillTime > 0.4) {
        ball.settled = true
        ball.vx = 0
        ball.vy = 0
      }
    }
  }
}

export function initGaltonBoard(canvas, button, status) {
  const context = canvas.getContext('2d')
  if (!context) {
    status.textContent = 'Your browser does not support this animation.'
    return
  }

  const simulation = new GaltonSimulation()
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let phase = 'ready'
  let angle = 0
  let startAngle = 0
  let turnStarted = 0
  let previousTime = 0
  let elapsed = 0
  let frame = 0
  let announcedCount = BOARD.ballCount

  const draw = () => {
    const light = document.documentElement.classList.contains('light')
    const scale = canvas.width / BOARD.width
    context.setTransform(scale, 0, 0, scale, 0, 0)
    context.clearRect(0, 0, BOARD.width, BOARD.height)
    context.save()
    context.translate(BOARD.width / 2, BOARD.height / 2)
    if (phase === 'flipping') {
      const cos = Math.abs(Math.cos(angle))
      const sin = Math.abs(Math.sin(angle))
      const fit = Math.min(BOARD.width / (BOARD.width * cos + BOARD.height * sin), BOARD.height / (BOARD.width * sin + BOARD.height * cos))
      context.scale(fit, fit)
    }
    context.rotate(angle)
    context.translate(-BOARD.width / 2, -BOARD.height / 2)

    context.strokeStyle = light ? '#94a3b8' : 'rgba(255, 255, 255, 0.55)'
    context.lineWidth = 1.5
    context.lineJoin = 'round'
    context.beginPath()
    context.roundRect(22, 22, BOARD.width - 44, BOARD.height - 44, 20)
    context.stroke()

    // The narrow neck joins the reservoir to the triangular peg field.
    context.beginPath()
    for (const side of [-1, 1]) {
      context.moveTo(BOARD.width / 2 + side * chamber[0].halfWidth, chamber[0].y)
      for (const point of chamber.slice(1)) {
        context.lineTo(BOARD.width / 2 + side * point.halfWidth, point.y)
      }
    }
    context.moveTo(BOARD.width / 2 - chamber[0].halfWidth, BOARD.top)
    context.lineTo(BOARD.width / 2 + chamber[0].halfWidth, BOARD.top)
    context.moveTo(BOARD.inset, BOARD.bottom)
    context.lineTo(BOARD.width - BOARD.inset, BOARD.bottom)
    context.stroke()

    context.beginPath()
    for (const divider of dividers) {
      context.moveTo(divider.x, divider.top)
      context.lineTo(divider.x, divider.bottom)
    }
    context.stroke()

    context.fillStyle = light ? '#64748b' : '#ffffff'
    context.beginPath()
    for (const peg of pegs) {
      context.moveTo(peg.x + BOARD.pegRadius, peg.y)
      context.arc(peg.x, peg.y, BOARD.pegRadius, 0, Math.PI * 2)
    }
    context.fill()

    // The guide uses the mean and variance of fourteen fair left/right choices.
    const sigma = Math.sqrt(BOARD.rows) * binWidth / 2
    context.strokeStyle = light ? '#475569' : 'rgba(255, 255, 255, 0.85)'
    context.lineWidth = 2.5
    context.beginPath()
    for (let x = BOARD.inset; x <= BOARD.width - BOARD.inset; x += 2) {
      const offset = (x - BOARD.width / 2) / sigma
      const y = BOARD.bottom - 6 - 190 * Math.exp(-0.5 * offset * offset)
      if (x === BOARD.inset) context.moveTo(x, y)
      else context.lineTo(x, y)
    }
    context.stroke()

    context.fillStyle = light ? '#475569' : '#ffffff'
    context.font = '13px Inter, system-ui, sans-serif'
    context.textAlign = 'center'
    context.fillText('p = ½', BOARD.width / 2, 43)
    context.fillText('NORMAL DISTRIBUTION', BOARD.width / 2, 635)

    context.fillStyle = light ? '#0f172a' : '#ffffff'
    context.beginPath()
    for (const ball of simulation.balls) {
      context.moveTo(ball.x + BOARD.ballRadius, ball.y)
      context.arc(ball.x, ball.y, BOARD.ballRadius, 0, Math.PI * 2)
    }
    context.fill()
    context.restore()
  }

  const tick = (time) => {
    frame = 0
    if (phase === 'flipping') {
      const progress = Math.min((time - turnStarted) / (reducedMotion.matches ? 1 : 700), 1)
      const eased = progress * progress * (3 - 2 * progress)
      angle = startAngle + Math.PI * eased
      if (progress === 1) {
        angle %= Math.PI * 2
        simulation.flip()
        phase = 'falling'
        previousTime = time
        elapsed = 0
      }
    }
    if (phase === 'falling') {
      elapsed += Math.min((time - previousTime) / 1000, 0.05)
      previousTime = time
      while (elapsed >= 1 / 120) {
        simulation.step(1 / 120)
        elapsed -= 1 / 120
      }
      const count = simulation.settledCount
      if (count === BOARD.ballCount) {
        phase = 'ready'
        button.disabled = false
        status.textContent = simulation.gravity < 0
          ? `All ${BOARD.ballCount} balls are in the hopper. Flip to release them.`
          : `All ${BOARD.ballCount} balls have settled. Ready to flip.`
      } else if (Math.floor(count / 12) > Math.floor(announcedCount / 12)) {
        status.textContent = `${count} of ${BOARD.ballCount} balls settled. Let them finish falling.`
      }
      announcedCount = count
    }
    canvas.dataset.state = phase
    canvas.dataset.settled = String(simulation.settledCount)
    draw()
    if (phase !== 'ready') frame = requestAnimationFrame(tick)
  }

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(canvas.clientWidth * ratio)
    canvas.height = Math.round(canvas.width * BOARD.height / BOARD.width)
    draw()
  }

  button.addEventListener('click', () => {
    if (phase !== 'ready' || simulation.settledCount !== BOARD.ballCount) return
    phase = 'flipping'
    button.disabled = true
    canvas.dataset.state = phase
    startAngle = angle
    turnStarted = performance.now()
    announcedCount = 0
    status.textContent = 'Board flipping. Wait for all the balls to settle.'
    frame = requestAnimationFrame(tick)
  })

  new ResizeObserver(resize).observe(canvas)
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(frame)
    frame = 0
  })
  window.addEventListener('pageshow', () => {
    if (phase !== 'ready' && !frame) {
      previousTime = performance.now()
      frame = requestAnimationFrame(tick)
    }
  })
  canvas.dataset.state = phase
  canvas.dataset.settled = String(BOARD.ballCount)
  status.textContent = `All ${BOARD.ballCount} balls have settled. Ready to flip.`
  button.disabled = false
  resize()
}
