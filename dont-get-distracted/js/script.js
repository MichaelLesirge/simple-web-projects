// make circle follow cursor slowly
// make circle grow on mouse down and shrink fast when mouse is lifted

const blob = document.getElementById("blob");
let duration = 0;

document.addEventListener("mousemove", (event) => {
    const {clientX, clientY} = event;

    blob.animate({
        left: `${clientX}px`,
        top: `${clientY}px`,
    }, {duration: duration, fill: "forwards"})

    duration = 100;
})