{
    const dragDuration = 200;

    const blob = document.getElementById("blob");
    let duration = 0;

    document.addEventListener("mousemove", (event) => {
        const { clientX, clientY } = event;

        blob.animate({
            left: `${clientX}px`,
            top: `${Math.min(clientY + window.scrollY, window.innerHeight - Math.max(blob.clientHeight, blob.clientWidth))}px`,
        }, { duration: duration, fill: "forwards" })

        duration = dragDuration;
    })

    document.addEventListener("mousedown", () => blob.style.background = "red")
    document.addEventListener("mouseup", () => blob.style.background = "")
}

function charRange(startChar, stopChar) {
    return Array.from({ length: stopChar.charCodeAt() - startChar.charCodeAt() + 1 }, (_, i) => String.fromCharCode(i + startChar.charCodeAt())).join("");
}

function randChar(charSet) {
    return charSet[Math.ceil(Math.random() * charSet.length) - 1]
}

{

    const randomCharSet = charRange("a", "z") + charRange("A", "Z") + charRange("0", "9") + "`-=[]\\;',./~_+{}|:\"<>?".repeat(2);
    const iterWait = 50;
    const addAfter = 3000;

    document.querySelectorAll(".hacker-text").forEach((element) => {
        let isActive = false;

        element.addEventListener("mouseover", (event) => {
            if (isActive) return;
            isActive = true;

            const startString = element.innerText;
            let charSet = startString + randomCharSet;

            let startChars = Array.from(startString);
            let curChars = new Array(startChars.length);

            let count = 0

            let intervalId = setInterval(() => {
                count++;

                for (let i = 0; i < curChars.length; i++) {
                    // curChars[i] = curChars[i] === startString[i] ? curChars[i] : randChar(charSet);
                    if (curChars[i] !== startChars[i]) {
                        curChars[i] = randChar(charSet);
                        if (count * iterWait > addAfter) charSet += " ";
                    }
                    if (curChars[i] === " ") curChars[i] = startChars[i];
                }

                const curString = curChars.join("");
                element.innerText = curString;

                if (curString === startString) {
                    clearInterval(intervalId);
                    isActive = false;
                }
            }, iterWait)

        })
    })
};

function startLoop(init, clear, draw) {
    init();
    const loop = () => {
        clear()
        draw()
        requestAnimationFrame(loop);
    };
    loop();
}

function respondToVisibility(element, callback, ratio = 0) {
    const options = {
        root: document.documentElement,
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            callback(entry.intersectionRatio > ratio);
        });
    }, options);

    observer.observe(element);
}


function updateCanvasSizes(canvas) {

    function updateCanvasSizeWithDpr() {
        const dpr = Math.ceil(window.devicePixelRatio || 1);
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
    }

    window.addEventListener("resize", updateCanvasSizeWithDpr);
    updateCanvasSizeWithDpr()
}

{
    const canvas = document.querySelector("#spiral");
    updateCanvasSizes(canvas);

    const colors = ["#D0E7F5", "#D9E7F4", "#D6E3F4", "#BCDFF5", "#B7D9F4", "#C3D4F0", "#9DC1F3", "#9AA9F4", "#8D83EF", "#AE69F0", "#D46FF1", "#DB5AE7", "#D911DA", "#D601CB", "#E713BF", "#F24CAE", "#FB79AB", "#FFB6C1", "#FED2CF", "#FDDFD5", "#FEDCD1"];

    const settings = {
        startTime: new Date().getTime(),

        durationSeconds: 60 * 30,

        maxCycles: Math.max(colors.length, 100),

        pulseEnabled: true,

        backgroundColor: "black",
    }

    const ctx = canvas.getContext("2d");

    function calculateVelocity(index) {
        const numberOfCycles = settings.maxCycles - index;
        const distancePerCycle = 2 * Math.PI;

        return (numberOfCycles * distancePerCycle) / settings.durationSeconds;
    }

    function calculateNextImpactTime(currentImpactTime, velocity) {
        return currentImpactTime + (Math.PI / velocity) * 1000;
    }

    function calculateDynamicOpacity(currentTime, lastImpactTime, baseOpacity, maxOpacity, duration) {
        const timeSinceImpact = currentTime - lastImpactTime, percentage = Math.min(timeSinceImpact / duration, 1);
        const opacityDelta = maxOpacity - baseOpacity;

        return maxOpacity - (opacityDelta * percentage);
    }

    function determineOpacity(currentTime, lastImpactTime, baseOpacity, maxOpacity, duration) {
        if (!settings.pulseEnabled) return baseOpacity;

        return calculateDynamicOpacity(currentTime, lastImpactTime, baseOpacity, maxOpacity, duration);
    }

    function calculatePositionOnArc(center, radius, angle) {
        return ({
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
        });
    }

    let arcs = [];

    function clear() {
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fill();
    }

    function init() {
        settings.startTime = new Date().getTime();

        ctx.lineCap = "round";

        arcs = colors.map((color, index) => {
            const velocity = calculateVelocity(index);
            const lastImpactTime = 0;
            const nextImpactTime = calculateNextImpactTime(settings.startTime, velocity);

            return {
                color,
                velocity,
                lastImpactTime,
                nextImpactTime
            };
        });
    }

    function drawArc(x, y, radius, start, end, fill = false) {
        ctx.beginPath();

        ctx.arc(x, y, radius, start, end);

        if (fill) ctx.fill();
        else ctx.stroke();
    }

    function drawPointOnArc(center, arcRadius, pointRadius, angle) {
        const position = calculatePositionOnArc(center, arcRadius, angle);

        drawArc(position.x, position.y, pointRadius, 0, 2 * Math.PI, true);
    }

    const length = Math.min(canvas.width, canvas.height) * 0.9, offset = (canvas.width - length) / 2;

    const start = {
        x: offset,
        y: canvas.height / 2
    };

    const end = {
        x: canvas.width - offset,
        y: canvas.height / 2
    };

    const center = {
        x: canvas.width / 2,
        y: canvas.height / 2
    };

    const baseLength = end.x - start.x;
    const base = {
        length: baseLength,
        minAngle: 0,
        startAngle: 0,
        maxAngle: 2 * Math.PI,
        initialRadius: baseLength * 0.05,
        circleRadius: baseLength * 0.006,
        clearance: baseLength * 0.03,
    };
    base.spacing = (base.length - base.initialRadius - base.clearance) / 2 / colors.length;

    function draw() {
        const currentTime = new Date().getTime();
        const elapsedTime = (currentTime - settings.startTime) / 1000;

        arcs.forEach((arc, index) => {
            const radius = base.initialRadius + (base.spacing * index);

            // Draw arcs
            ctx.globalAlpha = determineOpacity(currentTime, arc.lastImpactTime, 0.15, 0.65, 1000);
            ctx.lineWidth = base.length * 0.002;
            ctx.strokeStyle = arc.color;

            const offset = base.circleRadius * (5 / 3) / radius;

            drawArc(center.x, center.y, radius, Math.PI + offset, (2 * Math.PI) - offset);

            drawArc(center.x, center.y, radius, offset, Math.PI - offset);

            // Draw impact points
            ctx.globalAlpha = determineOpacity(currentTime, arc.lastImpactTime, 0.15, 0.85, 1000);
            ctx.fillStyle = arc.color;

            drawPointOnArc(center, radius, base.circleRadius * 0.75, Math.PI);

            drawPointOnArc(center, radius, base.circleRadius * 0.75, 2 * Math.PI);

            // Draw moving circles
            ctx.globalAlpha = 1;
            ctx.fillStyle = arc.color;

            if (currentTime >= arc.nextImpactTime) {
                arc.lastImpactTime = arc.nextImpactTime;
                arc.nextImpactTime = calculateNextImpactTime(arc.nextImpactTime, arc.velocity);
            }

            const distance = elapsedTime >= 0 ? (elapsedTime * arc.velocity) : 0, angle = (Math.PI + distance) % base.maxAngle;

            drawPointOnArc(center, radius, base.circleRadius, angle);
        });
    }

    respondToVisibility(canvas, init, 1)
    canvas.addEventListener("click", init)
    startLoop(init, clear, draw)
}

{
    const canvas = document.querySelector('#matrix');
    updateCanvasSizes(canvas)

    const ctx = canvas.getContext('2d');

    const chars = charRange("a", "z") + charRange("0", "9") + "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン";
    const fallingCharArr = [];

    const fontSize = 20;
    const trail = 20;
    const trailGap = 20;

    const maxColum = canvas.width / fontSize;

    function randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    for (var i = 0; i < maxColum; i++) {
        fallingCharArr.push({ x: i * fontSize, y: randomFloat(-500, 0), speed: randomFloat(1, 5) });
    }

    function clear() {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fill();
    }

    ctx.font = fontSize + "px san-serif";
    ctx.textAlign = "center";
    function draw() {
        for (const fallingChar of fallingCharArr) {


            for (let i = 0; i < trail; i++) {
                ctx.fillStyle = `rgba(0, 255, 0, ${(trail - i + 1) / trail})`
                ctx.fillText(randChar(chars), fallingChar.x, fallingChar.y - (i * trailGap));
            }

            fallingChar.y += fallingChar.speed;

            if (fallingChar.y > canvas.height + trail * trailGap) {
                fallingChar.y = randomFloat(-500, 0)
                fallingChar.speed += randomFloat(-1.5, 1.5)
            }
        }
    }

    startLoop(() => { }, clear, draw)
}

{
    const canvas = document.getElementById('particle');
    updateCanvasSizes(canvas)

    const ctx = canvas.getContext('2d');
    const particles = [];

    const particlesNum = 100;
    const distanceConnect = 100;

    const colors = ['#f35d4f', '#f36849', '#c0d988', '#6ddaf1', '#f1e85b'];

    class Factory {
        constructor() {
            this.x = Math.round(Math.random() * canvas.width);
            this.y = Math.round(Math.random() * canvas.height);
            this.rad = Math.round(Math.random() * 1) + 1;
            this.rgba = colors[Math.round(Math.random() * 3)];
            this.vx = Math.round(Math.random() * 3) - 1.5;
            this.vy = Math.round(Math.random() * 3) - 1.5;
        }
    }

    function init() {
        for (var i = 0; i < particlesNum; i++) {
            particles.push(new Factory());
        }
    };

    function clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fill();
    }

    function draw() {

        ctx.globalCompositeOperation = 'lighter';
        for (const particle of particles) {
            let factor = 1;
            for (const otherParticle of particles) {
                if (particle.rgba === otherParticle.rgba && findDistance(particle, otherParticle) < distanceConnect) {
                    ctx.strokeStyle = particle.rgba;
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(otherParticle.x, otherParticle.y);
                    ctx.stroke();
                    factor++;
                }
            }

            ctx.fillStyle = particle.rgba;
            ctx.strokeStyle = particle.rgba;

            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.rad * factor, 0, Math.PI * 2, true);
            ctx.fill();
            ctx.closePath();

            ctx.beginPath();
            ctx.arc(particle.x, particle.y, (particle.rad + 5) * factor, 0, Math.PI * 2, true);
            ctx.stroke();
            ctx.closePath();

            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x > canvas.width) particle.x = 0;
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.y > canvas.height) particle.y = 0;
            if (particle.y < 0) particle.y = canvas.height;
        }
    }

    function findDistance(p1, p2) {
        return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    }

    startLoop(init, clear, draw)
}