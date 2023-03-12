// make circle follow cursor slowly
// make circle grow on mouse down and shrink fast when mouse is lifted

const blob = document.getElementById("blob");

document.addEventListener("mousemove", (event) => {
    const {clientX, clientY} = event;

    blob.animate({
        left: `${clientX}px`,
        top: `${clientY}px`,
    }, {duration: 300, fill: "forwards"})

    blob.style.left = clientX + "px";
    blob.style.top = clientY + "px";
})