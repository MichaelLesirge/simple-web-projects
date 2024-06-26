
export default function makeFollowMouse(blob, {dragDuration = 200} = {}) {
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