import * as THREE from 'three'

const RED_NUMS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
])

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

export function createRouletteWheelTexture(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 8
  const pockets = 38
  const order = [
    0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1,
    '00', 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2,
  ]

  for (let i = 0; i < pockets; i++) {
    const a0 = (i / pockets) * Math.PI * 2 - Math.PI / 2
    const a1 = ((i + 1) / pockets) * Math.PI * 2 - Math.PI / 2
    const val = order[i % order.length]
    const isGreen = val === 0 || val === '00'
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, a0, a1)
    ctx.closePath()
    ctx.fillStyle = isGreen ? '#1b7a43' : RED_NUMS.has(val as number) ? '#b91c1c' : '#141414'
    ctx.fill()
    ctx.strokeStyle = '#c9a13f'
    ctx.lineWidth = 2
    ctx.stroke()

    const mid = (a0 + a1) / 2
    const tx = cx + Math.cos(mid) * (r * 0.72)
    const ty = cy + Math.sin(mid) * (r * 0.72)
    ctx.save()
    ctx.translate(tx, ty)
    ctx.rotate(mid + Math.PI / 2)
    ctx.fillStyle = '#f5f0e6'
    ctx.font = 'bold 14px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(val), 0, 0)
    ctx.restore()
  }

  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2)
  ctx.fillStyle = '#c9a13f'
  ctx.fill()

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}