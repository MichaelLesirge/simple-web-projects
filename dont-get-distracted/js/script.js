let count = 0;

// make circle follow cursor slowly
// make circle grow on mouse down and shrink fast when mouse is lifted

setInterval(() => {
    document.body.style.background = `radial-gradient(circle, rgba(11, 137, 140, 1) ${count % 50}%, rgba(0, 0, 0, 1) 100%)`;
    count++;
}, 100)