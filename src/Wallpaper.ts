import * as Chroma from "chroma-js";
import * as MathJS from "mathjs";
import { TweenMax } from "gsap";

interface Block {
    height: number;
    spacing: number;
}

type ColorStops = Array<any>;

interface Peaks {
    t: number;
    l: number;
    r: number;
}

export interface Configuration {
    bar: Block;
    stops: ColorStops;
    staticColor: any;
    useRainbow: boolean;
}

export default class Wallpaper {

    private readonly selector: HTMLCanvasElement;
    private readonly config: Configuration;

    private state: boolean = false;
    private loop: number = 0;
    private stream: Array<number> = [];

    private readonly peaks: Peaks = { t: 0, l: 0, r: 0 };

    private height = this.selector.height;
    private width = this.selector.width;

    private scale: number = 1.25;

    constructor(selector: HTMLCanvasElement, config: Configuration) {
        this.selector = selector;
        this.config = config;
    }

    public start(): void {
        this.loop = setInterval(this.tick, 1000 / 144)
    }

    public stop(): void {
        clearInterval(this.loop);
        this.state = false;
    }

    public tick(): void {
        let ctx = this.selector.getContext('2d');

        if (ctx === null) {
            throw new Error("Unknown Context.");
        }

        ctx.clearRect(0, 0, this.width, this.height);

        if (this.config.useRainbow) {
            ctx.fillStyle = this.color(this.selector, ctx);
        } else {
            ctx.fillStyle = this.config.staticColor.hex();
        }

        let width: number = Math.round(1 / 64 * this.selector.width);
        for (let i = 0; i < 64; i++) {
            let height: number = this.config.bar.height * this.scale * this.stream[i];
            ctx.fillRect((width * i) + (this.config.bar.spacing / 2), (this.selector.height - height) - 40, width - this.config.bar.spacing, height);
            ctx.fillRect((width * i) + (this.config.bar.spacing / 2), 0, width - this.config.bar.spacing, height);
        }
    }

    private color(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): CanvasGradient {
        let gradient = ctx.createLinearGradient(
            (canvas.width * 0.2) * -1,
            0,
            canvas.width * 1.4,
            canvas.height
        );

        this.config.stops.forEach((el: Chroma.Color, index: number) => {
            gradient.addColorStop(index / this.config.stops.length, el.hex());
        });

        return gradient;
    }

    public listener(feed: Array<number>) {
        let avgs: Array<number> = [];

        feed.forEach((el: number, index: number) => {
            if (el & 2) {
                avgs.push((feed[index - 1] + el) / 2);
            }
        });

        TweenMax.to(this.peaks.t, 0.2, MathJS.max(feed));
        TweenMax.to(this.peaks.l, 0.2, MathJS.max(feed.slice(0, Math.floor(feed.length / 2))));
        TweenMax.to(this.peaks.r, 0.2, MathJS.max(feed.slice(Math.floor(feed.length / 2), feed.length)));

        avgs.forEach((el: number, index: number) => {
            if (!this.stream[index]) {
                this.stream.push(el);
            } else {
                TweenMax.to(this.stream[index], 0.2, el as any);
            }
        })
    }

}
