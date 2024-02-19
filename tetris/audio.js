
let audioCtx;
let keyAudioBuffers = [];
let spaceAudioBuffer;
let ambienceBuffer;
let ambienceAudioSource;
let muteSound; 

const path = "./sounds/"

function playAudioKey(keyCode) {
    console.log(keyCode);
    if (keyCode === " ") {
        playAudio(spaceAudioBuffer)
        return
    }

    let i = Math.random() * keyAudioBuffers.length << 0
    playAudio(keyAudioBuffers[i]);
}

function playAudio(buffer, loop) {
    if (!buffer || muteSound)
        return

    let source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);

    if (loop)
        source.loop = true;

    
    source.start(0);
    
    return source
}

function loadAudioBuffer(filename, next) {
    function performReq(filename) {
        let request = new XMLHttpRequest();

        request.open('GET', path + filename, true);
        request.responseType = 'arraybuffer';

        request.onload = function () {
            audioCtx.decodeAudioData(request.response, next,
                function (e) { "Error with decoding audio data" + e.err });
        }
        request.send();
    }

    (filename.map && filename.map(performReq)) || performReq(filename)
}

audioCtx = new (window.AudioContext || window.webkitAudioContext)()

loadAudioBuffer(['key1.ogg', 'key2.ogg', 'key3.ogg', 'key4.ogg'],
    function (buffer) {
        keyAudioBuffers.push(buffer)
    })

loadAudioBuffer("space.ogg", function (buffer) {
    spaceAudioBuffer = buffer
})

loadAudioBuffer('ambience.ogg', function (buffer) {
    ambienceAudioSource = playAudio(ambienceBuffer = buffer, true)
})

loadAudioBuffer('beep.ogg', playAudio)

// document.getElementById("mute-sound").addEventListener("click", function (e) {
//     muteSound = !muteSound

//     if (muteSound)
//         ambienceAudioSource && ambienceAudioSource.stop(0)
//     else
//         ambienceAudioSource = playAudio(ambienceBuffer, true)

//     e.target.innerHTML = muteSound ? "UNMUTE SOUND" : "MUTE SOUND"
//     e.target.blur()
// })

window.playAudioKey = playAudioKey
