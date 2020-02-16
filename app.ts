'use strict'
import chroma from 'chroma-js'
import TweenMax from 'gsap/TweenMax'
import math from 'mathjs'

let running = false
let stream: Array<{ value: number }> = []
let fps = 60
let rainbow = true
let loop: number
let canvas: HTMLCanvasElement = document.querySelector('.render') || document.createElement('canvas')
let w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
let h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
let scale = window.devicePixelRatio

let peaks = {
  total: {value: 0},
  left: {value: 0},
  right: {value: 0}
}

let spectrum = [
  {stopPercent: 1 / 3, color: '#f5f5f5'},
  {stopPercent: 2 / 3, color: '#f2f2f2'},
  {stopPercent: 3 / 3, color: '#ffffff'},
]

let bar = {
  height: 400,
  spacing: 6,
  color: chroma('blue')
}

canvas.width = w * scale
canvas.height = h * scale
if (scale === 1) {
  switch (true) {
    case h === 1440:
      scale = 1.25
    case h >= 2160:
      scale = 1.5
    default:
      scale = 1
  }
}

let start = () => {
  if (running) {
    return
  }
  loop = setInterval(onTick, 1000 / fps)
  running = true
}

let stop = () => {
  if (!running) {
    return
  }

  clearInterval(loop)
  running = false
}

let onTick = () => {
  let context: CanvasRenderingContext2D | null = canvas.getContext('2d')

  if (context === null) {
    return
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  if (rainbow) {
    context.fillStyle = color(canvas, context)
  } else {
    context.fillStyle = bar.color.hex()
  }

  let width = Math.round(1 / 64 * canvas.width)
  for (let i = 0; i < 64; i++) {
    if (stream[i]) {
      let height = bar.height * scale * stream[i].value
      context.fillRect((width * i) + (bar.spacing / 2), (canvas.height - height), width - bar.spacing, height)
      context.fillRect((width * i) + (bar.spacing / 2), 0, width - bar.spacing, height)
    }
  }
}

let color = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
  let gradient = context.createLinearGradient((canvas.width * 0.2) * -1, 0, canvas.width * 1.4, canvas.height)
  for (let color of spectrum) {
    gradient.addColorStop(color.stopPercent, color.color)
  }
  return gradient
}

let listener = (feed: Array<number>) => {
  let averages = []
  for (let i = 0; i < feed.length; ++i) {
    if (i % 2) {
      averages.push((feed[i - 1] + feed[i]) / 2)
    }
  }

  TweenMax.to(peaks.total, 0.2, {value: math.max(feed)})
  TweenMax.to(peaks.left, 0.2, {value: math.max(feed.slice(0, Math.floor(feed.length / 2)))})
  TweenMax.to(peaks.right, 0.2, {value: math.max(feed.slice(Math.floor(feed.length / 2), feed.length))})

  for (let j = 0; j < averages.length; ++j) {
    if (!stream[j]) {
      stream.push({value: averages[j]})
    } else {
      TweenMax.to(stream[j], 0.2, {value: averages[j]})
    }
  }
}

window.wallpaperPropertyListener = {
  applyGeneralProperties: (properties) => {
    if (properties.fps && fps !== properties.fps) {
      fps = properties.fps
      stop()
      start()
    }
  },
  setPaused: (state) => state ? stop() : start()
}

start()
window.wallpaperRegisterAudioListener(listener)
