

const path = "./sounds/"

let audioCtx;
let keyAudioBuffers = [];
let spaceAudioBuffer;
let ambienceBuffer;
let ambienceAudioSource;
let muteSound = false; 

function playAudio(buffer, loop, audioCtx) {
    if (!buffer || muteSound) return

    let source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);

    if (loop) source.loop = true;

    source.start(0);
    
    return source
}

export function playAudioKey(keyCode, audioCtx) {
    if (keyCode === " ") {
        playAudio(spaceAudioBuffer, false, audioCtx)
        return
    }

    let i = Math.random() * keyAudioBuffers.length << 0
    playAudio(keyAudioBuffers[i], false, audioCtx);
}

export function loadAudio() {
    function loadAudioBuffer(filenames, next) {
        function performReq(filename) {
            let request = new XMLHttpRequest();

            request.open('GET', path + filename, true);
            request.responseType = 'arraybuffer';

            request.onload = function () {
                audioCtx.decodeAudioData(request.response, next, (e) => "Error with decoding audio data: " + e.err);
            }
            request.send();
        }

        filenames.map(performReq);
    }

    audioCtx = new (window.AudioContext || window.webkitAudioContext)()

    loadAudioBuffer(["key1.ogg", "key2.ogg", "key3.ogg", "key4.ogg"],
        (buffer) => keyAudioBuffers.push(buffer))

    loadAudioBuffer(["space.ogg"], (buffer) => spaceAudioBuffer = buffer)

    loadAudioBuffer(["ambience.ogg"], (buffer) => ambienceAudioSource = playAudio(ambienceBuffer = buffer, true, audioCtx))

    loadAudioBuffer(["beep.ogg"], (buffer) => playAudio(buffer, false, audioCtx))

    return audioCtx;
}

