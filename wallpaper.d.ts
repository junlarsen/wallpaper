// @ts-ignore
declare global {
    interface Window {
        wallpaperPropertyListener: any
        wallpaperRegisterAudioListener: Function
    }
}

declare module 'gsap/TweenMax' {
    const mod: any
    export = mod
}