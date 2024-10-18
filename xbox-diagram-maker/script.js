const canvas = document.getElementById("controllerCanvas");
const ctx = canvas.getContext("2d");

const LEFT = 159;
const RIGHT = 485;

const rows = [
    21,
    60,
    94,
    292,
    318,
    345,
    376,
]

// https://support.xbox.com/en-US/help/hardware-network/controller/xbox-one-wireless-controller
const buttonPositions = {
    "View": [LEFT, rows[0]],
    "Menu": [RIGHT, rows[0]],
    "Left Bumper": [LEFT, rows[1]],
    "Right Bumper": [RIGHT, rows[1]],
    "Left Trigger": [LEFT, rows[2]],
    "Right Trigger": [RIGHT, rows[2]-8],
    "Left Stick Y Axis": [LEFT, 130],
    "Left Stick X Axis": [LEFT, 160],
    "Left Stick Button": [LEFT, 190],
    "Y": [RIGHT, 118],
    "B": [RIGHT, 161],
    "X": [RIGHT, 183],
    "A": [RIGHT, 273],
    "D-pad Up": [LEFT, rows[3]],
    "D-pad Left": [LEFT, rows[4]],
    "D-pad Down": [LEFT, rows[5]],
    "D-pad Right": [LEFT, rows[6]],
    "Right Stick Y Axis": [RIGHT, rows[4]],
    "Right Stick X Axis": [RIGHT, rows[5]],
    "Right Stick Button": [RIGHT, rows[6]],
};

const labels = {};
const controllerImage = new Image();
controllerImage.src = "controller-diagram.png";

const DEBUG = false;

let title = "";

function drawController() {    

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(controllerImage, 0, 0, canvas.width, canvas.height);

    ctx.textBaseline = "middle"

    ctx.direction = "ltr";
    ctx.font = "32px Arial"; 
    ctx.fillText(title, 5, 18);
    

    if (DEBUG) {
        for (const [button, position] of Object.entries(buttonPositions)) {
            if (position) {
    
                ctx.fillStyle = "#000";
                ctx.font = "16px Arial";
                ctx.direction = position[0] === LEFT ? "rtl" : "ltr";
                ctx.fillText(button, position[0], position[1]);
            }
        }
    }
    
    for (const [button, label] of Object.entries(labels)) {
        const position = buttonPositions[button];
        if (position) {
            ctx.fillStyle = "#000";
            ctx.font = "16px Arial";
            ctx.direction = position[0] === LEFT ? "rtl" : "ltr";
            ctx.fillText(label, position[0], position[1]);
        }
    }

    requestAnimationFrame(() => drawController())
}

const selector = document.getElementById("buttonSelect");
Object.keys(buttonPositions).forEach(button => {
    const option = document.createElement("option");
    option.setAttribute("value", button);
    option.innerText = button;
    selector.appendChild(option);
});

// Add label button click event
document.getElementById("addLabelButton").addEventListener("click", (e) => {
    const button = document.getElementById("buttonSelect").value;
    const label = document.getElementById("labelInput").value.trim();
    if (label) {
        labels[button] = label;
        drawController();
    }
});

document.getElementById("downloadButton").addEventListener("click", (e) => {
    const link = document.createElement("a");
    link.download = `${title || "default"}-controller-labeled.png`;
    link.href = canvas.toDataURL();
    link.click();
});

document.getElementById("title-input").addEventListener("input", (e) => {
    title = e.target.value;
});

drawController();
