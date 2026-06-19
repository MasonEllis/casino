import * as THREE from 'three'

const RED_NUMS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
])

export function pocketFillColor(val: number): string {
  if (val === 0) return '#1b7a43'
  return RED_NUMS.has(val) ? '#b91c1c' : '#17171c'
}

/** European single-zero wheel order (clockwise) — matches spinWheel() outcomes 0–36. */
export const WHEEL_POCKET_ORDER: number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1,
  20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
]

export function pocketIndexForNumber(n: number): number {
  return WHEEL_POCKET_ORDER.findIndex((v) => v === n)
}

/** Three.js Y-rotation (rad) — aligns pocket center with ball at top (-Z). */
export function wheelRotationForResult(result: number): number {
  const idx = pocketIndexForNumber(result)
  if (idx < 0) return 0
  const n = WHEEL_POCKET_ORDER.length
  return -((idx + 0.5) / n) * Math.PI * 2
}

/** SVG rotate() degrees — Y-down coords need opposite sign from Three.js. */
export function wheelSvgRotationDeg(result: number): number {
  const idx = pocketIndexForNumber(result)
  if (idx < 0) return 0
  const n = WHEEL_POCKET_ORDER.length
  return -((idx + 0.5) / n) * 360
}

export function spinTargetRotation(start: number, result: number, fullTurns = 5): number {
  const final = wheelRotationForResult(result)
  const tau = Math.PI * 2
  const startMod = ((start % tau) + tau) % tau
  const finalMod = ((final % tau) + tau) % tau
  let delta = finalMod - startMod
  if (delta <= 0) delta += tau
  return start + fullTurns * tau + delta
}

export function spinTargetSvgRotationDeg(startDeg: number, result: number, fullTurns = 5): number {
  const final = wheelSvgRotationDeg(result)
  const startMod = ((startDeg % 360) + 360) % 360
  const finalMod = ((final % 360) + 360) % 360
  let delta = finalMod - startMod
  if (delta > 0) delta -= 360
  return startDeg - fullTurns * 360 + delta
}

/** American roulette felt — number grid + outside bets. */
export function createRouletteLayoutTexture(): THREE.CanvasTexture {
  const w = 720
  const h = 520
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#0a5c34'
  ctx.fillRect(0, 0, w, h)

  const margin = 14
  const gridX = margin
  const gridY = margin + 8
  const gridW = w - margin * 2
  const zeroColW = gridW / 13
  const numGridX = gridX + zeroColW
  const numGridW = gridW - zeroColW
  const colW = numGridW / 12
  const rowH = 52
  const dozenH = 44
  const evenH = 44

  const stroke = () => {
    ctx.strokeStyle = 'rgba(232, 224, 200, 0.9)'
    ctx.lineWidth = 2
  }

  const cellColor = (n: number) => {
    if (n === 0) return '#1b7a43'
    return RED_NUMS.has(n) ? '#b91c1c' : '#141414'
  }

  const drawCell = (x: number, y: number, cw: number, ch: number, n: number | string) => {
    ctx.fillStyle = typeof n === 'number' ? cellColor(n) : '#1b7a43'
    ctx.fillRect(x, y, cw, ch)
    stroke()
    ctx.strokeRect(x, y, cw, ch)
    ctx.fillStyle = '#f5f0e6'
    ctx.font = 'bold 22px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(n), x + cw / 2, y + ch / 2)
  }

  // 0 spans the three number rows on the left (matches the betting UI)
  drawCell(gridX, gridY, zeroColW - 1, rowH * 3, '0')

  const nums = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  ]

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 12; c++) {
      drawCell(numGridX + c * colW, gridY + r * rowH, colW - 1, rowH, nums[r][c])
    }
  }

  // Outside bets — dozens then even-money (same order as the UI board)
  const dozenY = gridY + rowH * 3 + 4
  const sections = [
    { label: '1st 12', color: '#0d6e40' },
    { label: '2nd 12', color: '#0d6e40' },
    { label: '3rd 12', color: '#0d6e40' },
  ]
  const secW = numGridW / 3
  sections.forEach((s, i) => {
    const x = numGridX + i * secW
    ctx.fillStyle = s.color
    ctx.fillRect(x, dozenY, secW - 2, dozenH)
    stroke()
    ctx.strokeRect(x, dozenY, secW - 2, dozenH)
    ctx.fillStyle = '#e8e0c8'
    ctx.font = 'bold 16px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(s.label, x + secW / 2, dozenY + dozenH / 2)
  })

  const evenY = dozenY + dozenH + 4
  const bars = [
    { label: '1–18', w: numGridW * 0.2 },
    { label: 'EVEN', w: numGridW * 0.15 },
    { label: 'RED', w: numGridW * 0.15, fill: '#b91c1c' },
    { label: 'BLACK', w: numGridW * 0.15, fill: '#141414' },
    { label: 'ODD', w: numGridW * 0.15 },
    { label: '19–36', w: numGridW * 0.2 },
  ]
  let bx = numGridX
  for (const bar of bars) {
    ctx.fillStyle = bar.fill ?? '#0d6e40'
    ctx.fillRect(bx, evenY, bar.w - 2, evenH)
    stroke()
    ctx.strokeRect(bx, evenY, bar.w - 2, evenH)
    ctx.fillStyle = '#e8e0c8'
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(bar.label, bx + bar.w / 2, evenY + evenH / 2)
    bx += bar.w
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontForSize: (size: number) => string,
  maxSize: number,
  minSize: number,
): number {
  let size = maxSize
  while (size >= minSize) {
    ctx.font = fontForSize(size)
    if (ctx.measureText(text).width <= maxWidth) return size
    size -= 1
  }
  return minSize
}

function drawRouletteWheelFace(
  ctx: CanvasRenderingContext2D,
  size: number,
  opts: {
    fontSize: number
    labelRadius: number
    hubRadius: number
    padding: number
    adaptiveFont?: boolean
  },
) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - opts.padding
  const pockets = WHEEL_POCKET_ORDER.length

  ctx.clearRect(0, 0, size, size)

  for (let i = 0; i < pockets; i++) {
    const a0 = (i / pockets) * Math.PI * 2 - Math.PI / 2
    const a1 = ((i + 1) / pockets) * Math.PI * 2 - Math.PI / 2
    const val = WHEEL_POCKET_ORDER[i]
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, a0, a1)
    ctx.closePath()
    ctx.fillStyle = pocketFillColor(val)
    ctx.fill()
    ctx.strokeStyle = '#c9a13f'
    ctx.lineWidth = Math.max(1, size / 256)
    ctx.stroke()

    const mid = (a0 + a1) / 2
    const tx = cx + Math.cos(mid) * (r * opts.labelRadius)
    const ty = cy + Math.sin(mid) * (r * opts.labelRadius)
    ctx.save()
    ctx.translate(tx, ty)
    ctx.rotate(mid + Math.PI / 2)
    const label = String(val)
    const arcWidth = 2 * (r * opts.labelRadius) * Math.sin(Math.PI / pockets) * 0.9
    const fontSize = opts.adaptiveFont
      ? fitFontSize(
          ctx,
          label,
          arcWidth,
          (s) => `bold ${s}px Georgia, serif`,
          opts.fontSize,
          Math.max(10, Math.floor(opts.fontSize * 0.45)),
        )
      : opts.fontSize
    ctx.font = `bold ${fontSize}px Georgia, serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.lineWidth = Math.max(2, fontSize * 0.16)
    ctx.lineJoin = 'round'
    ctx.strokeText(label, 0, 0)
    ctx.fillStyle = '#f5f0e6'
    ctx.fillText(label, 0, 0)
    ctx.restore()
  }

  ctx.beginPath()
  ctx.arc(cx, cy, r * opts.hubRadius, 0, Math.PI * 2)
  ctx.fillStyle = '#c9a13f'
  ctx.fill()
}

export function createRouletteWheelCanvas(): HTMLCanvasElement {
  const tex = createRouletteWheelTexture()
  return tex.image as HTMLCanvasElement
}

/** High-res wheel for the betting UI — large adaptive labels for readability while spinning. */
export function createRouletteWheelCanvasForUI(): HTMLCanvasElement {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  drawRouletteWheelFace(ctx, size, {
    fontSize: 44,
    labelRadius: 0.84,
    hubRadius: 0.1,
    padding: 2,
    adaptiveFont: true,
  })
  return canvas
}

export function createRouletteWheelTexture(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  drawRouletteWheelFace(ctx, size, {
    fontSize: 14,
    labelRadius: 0.72,
    hubRadius: 0.22,
    padding: 8,
  })

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}