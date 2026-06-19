import { useMemo } from 'react'
import * as THREE from 'three'

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

export function createFeltDecalTexture(text: string, accent = '#e8d8a8'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 96
  const ctx = canvas.getContext('2d')!
  const pad = 12
  const maxW = canvas.width - pad * 2

  ctx.clearRect(0, 0, 256, 96)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const size = fitFontSize(
    ctx,
    text,
    maxW,
    (s) => `bold ${s}px Georgia, serif`,
    44,
    14,
  )
  ctx.font = `bold ${size}px Georgia, serif`
  ctx.fillStyle = accent
  ctx.globalAlpha = 0.9
  ctx.fillText(text, 128, 48)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function useFeltDecalTexture(text: string, accent = '#e8d8a8') {
  return useMemo(() => createFeltDecalTexture(text, accent), [text, accent])
}