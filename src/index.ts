// @ts-ignore
import TweenMax from 'gsap/TweenMax'

declare const window: Window & {
  wallpaperRegisterAudioListener(dispatcher: (stream: Array<number>) => void): void
  wallpaperPropertyListener: any
}

const clock: HTMLDivElement = document.getElementById('timer') as HTMLDivElement
const canvas: HTMLCanvasElement = document.getElementById('render') as HTMLCanvasElement
canvas.width = window.innerWidth
canvas.height = window.innerHeight

const stream: Array<{ value: number }> = []
const peaks = {
  total: { value: 0 },
  left: { value: 0 },
  right: { value: 0 }
}

const bar = {
  height: 400,
  spacing: 4,
  color: '#22AED1'
}

const onTimerTick = () => {
  const date = new Date()
  const tag = date.getHours() > 12 ? "PM" : "AM"

  clock.innerText = `${date.getHours()}:${date.getMinutes()} ${tag}`
}

const onTick = () => {
  const context: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = bar.color

  const width = Math.round(1 / 64 * canvas.width)

  for (let i = 0; i < 64; i++) {
    if (stream[i]) {
      const height = bar.height * window.devicePixelRatio * stream[i].value
      context.fillRect((width * i) + (bar.spacing / 2), (canvas.height - height), width - bar.spacing, height)
      context.fillRect((width * i) + (bar.spacing / 2), 0, width - bar.spacing, height)
    }
  }
}

const listener = (feed: Array<number>) => {
  console.log("[AUDIO FEED]: ", feed)
  const averages = []

  for (let i = 0; i < feed.length; ++i) {
    if (i % 2) {
      averages.push((feed[i - 1] + feed[i]) / 2)
    }
  }

  const left = feed.slice(0, Math.floor(feed.length / 2))
  const right = feed.slice(Math.floor(feed.length / 2), feed.length)

  TweenMax.to(peaks.total, 0.2, { value: Math.max(...feed) })
  TweenMax.to(peaks.left, 0.2, { value: Math.max(...left) })
  TweenMax.to(peaks.right, 0.2, { value: Math.max(...right) })

  for (let j = 0; j < averages.length; ++j) {
    if (!stream[j]) {
      stream.push({ value: averages[j] })
    } else {
      TweenMax.to(stream[j], 0.2, { value: averages[j] })
    }
  }
}

onTimerTick()
setInterval(onTick, 1000 / 60)
setInterval(onTimerTick, 1000)

window.wallpaperPropertyListener = {
  applyGeneralProperties: (properties: any) => {},
  setPaused: (state: boolean) => {}
}

window.wallpaperRegisterAudioListener(listener)
