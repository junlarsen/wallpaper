import Chroma from "chroma-js";
import TweenMax from "gsap/TweenMax";
import MathJS from "mathjs";

let status = false;
let rainbow = false;
var bars = [];

var total = {value: 0};
var left = {value: 0};
var right = {value: 0};

let stops = [
    {stop: 1 / 5, color: '#41c4f4'},
    {stop: 2 / 5, color: '#329adb'},
    {stop: 3 / 5, color: '#3280db'},
    {stop: 4 / 5, color: '#3259db'},
    {stop: 1, color: '#0001ff'}
];

let frames = 60;

let bar = {
    height: 500,
    spacing: 6,
    color: Chroma('red')
};

let loop;

let canvas = document.querySelector('.render');
let h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
let w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

let scale = window.devicePixelRatio;
if (scale === 1) {
    switch (true) {
        case h === 1440:
            scale = 1.25;
        case h >= 2160:
            scale = 1.5;
        default:
            scale = 1;
    }
} else {
    canvas.width = w * scale;
    canvas.height = h * scale;
}

function start() {
    if (status) return;
    loop = setInterval(onTick, 1000 / frames);
    status = true;
}

function stop() {
    if (!status) return;
    clearInterval(loop);
    status = false;
}

function onTick() {
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (rainbow) ctx.fillStyle = '';
    else ctx.fillStyle = bar.color.hex();

    let width = Math.round(1 / 64 * canvas.width);
    for (let i = 0; i < 64; i++) {
        let x = (width * i) + (bar.spacing / 2)
        let y = canvas.height;
        if (bars[i]) {
            let height = bar.height * scale * bars[i].value;
            ctx.fillRect(x, (y - height) - 40, width - bar.spacing, height);
        }
    }
}

start();

function audio(stream) {
    let newTotal = 0;
    let newLeft = 0;
    let newRight = 0;
    let averages = [];

    let half = Math.floor(stream.length / 2);

    let localLeft = stream.slice(0, half);
    let localRight = stream.slice(half, stream.length);

    newTotal = MathJS.max(stream);
    newLeft = MathJS.max(localLeft);
    newRight = MathJS.max(localRight);

    for (let i = 0; i < stream.length; ++i) {
        if (i % 2) {
            averages.push(stream[i - 1] + stream[i] / 2);
        }
    }

    TweenMax.to(total, 0.2, {value: newTotal});
    TweenMax.to(left, 0.2, {value: newLeft});
    TweenMax.to(right, 0.2, {value: newRight});

    for (let i = 0; i < stream.length; ++i) {
        if (!bars[i]) {
            bars.push({value: averages[i]});
        } else {
            TweenMax.to(bars[i], 0.2, {value: averages[i]});
        }
    }
}

window.wallpaperPropertyListener = {
    applyGeneralProperties: function (properties) {
        if (properties.fps) {
            // Restart the render loop at the new FPS if it is changed
            if (frames !== properties.fps) {
                frames = properties.fps;
                stop();
                start();
            }
        }
    },
    setPaused: function (isPaused) {
        if (isPaused) {
            stop();
        }
        else {
            start();
        }
    }
};

window.wallpaperRegisterAudioListener(audio);
