import Wallpaper, { Configuration } from "./src/Wallpaper";
import * as Chroma from "chroma-js";

const confg: Configuration = {
    bar: {
        height: 600,
        spacing: 6
    },
    // @ts-ignore
    stops: [Chroma('blue'), Chroma('red')],
    // @ts-ignore
    staticColor: Chroma('green'),
    useRainbow: false
};

// @ts-ignore
const canvas: HTMLElement = document.querySelector('.render');

if (canvas instanceof HTMLCanvasElement) {
    const App = new Wallpaper(canvas, confg);

    // @ts-ignore
    window.wallpaperPropertyListener = {
        setPaused: (state: boolean) => state ? App.stop() : App.start()
    };

    App.start();

    // @ts-ignore
    window.wallpaperRegisterAudioListener(App.listener);
}
