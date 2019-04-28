import chroma from "chroma-js";
import TweenMax from "gsap/TweenMax";
import math from "mathjs";

let running = false;

let stream = [];
let peaks = {
    total: {value: 0},
    left: {value: 0},
    right: {value: 0}
};

let colorStops = [
    {stopPercent: 1 / 5, color: '#41c4f4'},
    {stopPercent: 2 / 5, color: '#329adb'},
    {stopPercent: 3 / 5, color: '#3280db'},
    {stopPercent: 4 / 5, color: '#3259db'},
    {stopPercent: 1, color: '#0001ff'},
];

let bar = {
    height: 500,
    spacing: 6,
    color: chroma('blue')
};

let fps = 60;
let useRainbow = true;
let renderLoop;

let canvas = document.querySelector('.render');
let w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
let h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

let scale = window.devicePixelRatio;
if (scale === 1) {
    switch (true) {
        case h === 1440: scale = 1.25;
        case h >= 2160: scale = 1.5;
        default: scale = 1;
    }
    canvas.width = w;
    canvas.height = h;
} else {
    canvas.width = w * scale;
    canvas.height = h * scale;
}

function start() {
    if (running) {
        return;
    }

    renderLoop = setInterval(onTick, 1000 / fps);
    running = true;
}

function stop() {
    if (!running) {
        return;
    }

    clearInterval(renderLoop);
    running = false;
}

function onTick() {
    let context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (useRainbow) {
        context.fillStyle = gradient(canvas, context);
    } else {
        context.fillStyle = bar.color.hex();
    }

    let barWidth = Math.round(1 / 64 * canvas.width);
    for (let i = 0; i < 64; i++) {
        let x = ((barWidth) * i) + (bar.spacing / 2);
        let y = canvas.height;
        if (stream[i]) {
            let height = bar.height * scale * stream[i].value;
            context.fillRect(x, (y - height) - 40, barWidth - bar.spacing, height);
            context.fillRect(x, 0, barWidth - bar.spacing, height);
        }
    }
}

start();

function gradient(canvas, context) {
    let gradient = context.createLinearGradient((canvas.width * 0.2) * -1, 0, canvas.width * 1.4, canvas.height);

    for (let i = 0; i < colorStops.length; i++) {
        let tempColorStop = colorStops[i];
        let tempColor = tempColorStop.color;
        let tempStopPercent = tempColorStop.stopPercent;
        gradient.addColorStop(tempStopPercent, tempColor);

        colorStops[i] = tempColorStop;
    }
    return gradient;
}

function wallpaperAudioListener(audioData) {
    let newTotalPeak, newLeftPeak, newRightPeak;
    let audioDataAverage = [];

    let halfWayThough = Math.floor(audioData.length / 2);

    let left = audioData.slice(0, halfWayThough);
    let right = audioData.slice(halfWayThough, audioData.length);

    // Calculate according to calculation type, default to max

    newTotalPeak = math.max(audioData);
    newLeftPeak = math.max(left);
    newRightPeak = math.max(right);


    for (let i = 0; i < audioData.length; ++i) {
        // Average out two values
        if (i % 2) {
            audioDataAverage.push((audioData[i - 1] + audioData[i]) / 2)
        }
    }

    // Assign the new audio peak
    TweenMax.to(peaks.total, 0.2, {value: newTotalPeak});
    TweenMax.to(peaks.left, 0.2, {value: newLeftPeak});
    TweenMax.to(peaks.right, 0.2, {value: newRightPeak});

    // Transform the old data into the new
    for (let j = 0; j < audioDataAverage.length; ++j) {
        // If this is a fresh set of data, apply it
        if (!stream[j]) {
            stream.push({value: audioDataAverage[j]});
        }
        // If updating, tween between old and new
        else {
            TweenMax.to(stream[j], 0.2, {value: audioDataAverage[j]});
        }
    }
}

window.wallpaperPropertyListener = {
    applyGeneralProperties: function (properties) {
        if (properties.fps) {
            // Restart the render loop at the new FPS if it is changed
            if (fps !== properties.fps) {
                fps = properties.fps;
                stop();
                start();
            }
        }
    },
    setPaused: function (isPaused) {
        if (isPaused) {
            stop();
        } else {
            start();
        }
    }
};


window.wallpaperRegisterAudioListener(wallpaperAudioListener);
