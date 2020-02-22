'use strict'
import chroma from 'chroma-js'
// @ts-ignore
import TweenMax from 'gsap/TweenMax'
import math from 'mathjs'

declare const window: Window & {
  wallpaperPropertyListener: any
  wallpaperRegisterAudioListener: Function
}

const canvas: HTMLCanvasElement = document.querySelector('.render') || document.createElement('canvas')
const w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
const rainbow = true
const stream: Array<{ value: number }> = []

let running = false
let fps = 60
let loop: number
let scale = window.devicePixelRatio

const peaks = {
  total: { value: 0 },
  left: { value: 0 },
  right: { value: 0 }
}

const spectrum = [
  { stopPercent: 1, color: '#22AED1' }
]

const bar = {
  height: 400,
  spacing: 6,
  color: chroma('blue')
}

switch (true) {
  case h === 1440:
    scale = 1.25
    break
  case h >= 2160:
    scale = 1.5
    break
  default:
    scale = 1
}

canvas.width = w * scale
canvas.height = h * scale

const start = () => {
  if (running) {
    return
  }

  loop = setInterval(onTick, 1000 / fps)
  running = true
}

const stop = () => {
  if (!running) {
    return
  }

  clearInterval(loop)
  running = false
}

const onTick = () => {
  const context: CanvasRenderingContext2D | null = canvas.getContext('2d')

  if (context === null) {
    return
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  if (rainbow) {
    context.fillStyle = color(canvas, context)
  } else {
    context.fillStyle = bar.color.hex()
  }

  const width = Math.round(1 / 64 * canvas.width)
  for (let i = 0; i < 64; i++) {
    if (stream[i]) {
      const height = bar.height * scale * stream[i].value
      context.fillRect((width * i) + (bar.spacing / 2), (canvas.height - height), width - bar.spacing, height)
      context.fillRect((width * i) + (bar.spacing / 2), 0, width - bar.spacing, height)
    }
  }
}

const color = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
  const gradient = context.createLinearGradient((canvas.width * 0.2) * -1, 0, canvas.width * 1.4, canvas.height)
  for (const color of spectrum) {
    gradient.addColorStop(color.stopPercent, color.color)
  }
  return gradient
}

const listener = (feed: Array<number>) => {
  const averages = []
  for (let i = 0; i < feed.length; ++i) {
    if (i % 2) {
      averages.push((feed[i - 1] + feed[i]) / 2)
    }
  }

  TweenMax.to(peaks.total, 0.2, { value: math.max(feed) })
  TweenMax.to(peaks.left, 0.2, { value: math.max(feed.slice(0, Math.floor(feed.length / 2))) })
  TweenMax.to(peaks.right, 0.2, { value: math.max(feed.slice(Math.floor(feed.length / 2), feed.length)) })

  for (let j = 0; j < averages.length; ++j) {
    if (!stream[j]) {
      stream.push({ value: averages[j] })
    } else {
      TweenMax.to(stream[j], 0.2, { value: averages[j] })
    }
  }
}

window.wallpaperPropertyListener = {
  applyGeneralProperties: (properties: any) => {
    if (properties.fps && fps !== properties.fps) {
      fps = properties.fps
      stop()
      start()
    }
  },
  setPaused: (state: boolean) => state ? stop() : start()
}

start()
window.wallpaperRegisterAudioListener(listener)
