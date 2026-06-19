import * as THREE from 'three'

const RED_NUMS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
])

/** American wheel pocket order — matches the 3D wheel texture. */
export const WHEEL_POCKET_ORDER: (number | '00')[] = [
  0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1,
  '00', 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2,
]

export function pocketIndexForNumber(n: number): number {
  return WHEEL_POCKET_ORDER.findIndex((v) => v === n)
}

/** Rotation (rad) that aligns a pocket center with the fixed ball at the top of the track. */
export function wheelRotationForResult(result: number): number {
  const idx = pocketIndexForNumber(result)
  if (idx < 0) return 0
  return -((idx + 0.5) / WHEEL_POCKET_ORDER.length) * Math.PI * 2
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
  const zeroH = 40
  const gridH = h - margin * 2 - zeroH - 54
  const colW = gridW / 3
  const rowH = gridH / 12

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

  drawCell(gridX, gridY, gridW / 2 - 1, zeroH, '0')
  drawCell(gridX + gridW / 2 + 1, gridY, gridW / 2 - 1, zeroH, '00')

  const nums = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  ]

  const numTop = gridY + zeroH
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 12; r++) {
      drawCell(gridX + c * colW, numTop + r * rowH, colW, rowH, nums[c][r])
    }
  }

  // Outside bets
  const outY = h - margin - 48
  const sections = [
    { label: '1st 12', color: '#0d6e40' },
    { label: '2nd 12', color: '#0d6e40' },
    { label: '3rd 12', color: '#0d6e40' },
  ]
  const secW = gridW / 3
  sections.forEach((s, i) => {
    const x = gridX + i * secW
    ctx.fillStyle = s.color
    ctx.fillRect(x, outY, secW - 2, 48)
    stroke()
    ctx.strokeRect(x, outY, secW - 2, 48)
    ctx.fillStyle = '#e8e0c8'
    ctx.font = 'bold 16px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(s.label, x + secW / 2, outY + 24)
  })

  const barY = outY - 34
  const bars = [
    { label: '1–18', w: gridW * 0.2 },
    { label: 'EVEN', w: gridW * 0.15 },
    { label: 'RED', w: gridW * 0.15, fill: '#b91c1c' },
    { label: 'BLACK', w: gridW * 0.15, fill: '#141414' },
    { label: 'ODD', w: gridW * 0.15 },
    { label: '19–36', w: gridW * 0.2 },
  ]
  let bx = gridX
  for (const bar of bars) {
    ctx.fillStyle = bar.fill ?? '#0d6e40'
    ctx.fillRect(bx, barY, bar.w - 2, 30)
    stroke()
    ctx.strokeRect(bx, barY, bar.w - 2, 30)
    ctx.fillStyle = '#e8e0c8'
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(bar.label, bx + bar.w / 2, barY + 15)
    bx += bar.w
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function drawRouletteWheelFace(
  ctx: CanvasRenderingContext2D,
  size: number,
  opts: { fontSize: number; labelRadius: number; hubRadius: number; padding: number },
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
    const isGreen = val === 0 || val === '00'
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, a0, a1)
    ctx.closePath()
    ctx.fillStyle = isGreen ? '#1b7a43' : RED_NUMS.has(val as number) ? '#b91c1c' : '#141414'
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
    ctx.font = `bold ${opts.fontSize}px Georgia, serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)'
    ctx.lineWidth = Math.max(2, opts.fontSize * 0.14)
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

/** Decorative spin wheel for the betting UI — bold labels, compact hub. */
export function createRouletteWheelCanvasForUI(): HTMLCanvasElement {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  drawRouletteWheelFace(ctx, size, {
    fontSize: 17,
    labelRadius: 0.78,
    hubRadius: 0.14,
    padding: 4,
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