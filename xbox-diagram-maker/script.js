const canvas = document.getElementById("controllerCanvas");
const ctx = canvas.getContext("2d");

const DEBUG = false;

const LEFT = 157+2;
const RIGHT = 485-2;

const buttonPositions = {
    "View": [LEFT, 17],
    "Menu": [RIGHT, 17],
    "Left Bumper": [LEFT, 55],
    "Right Bumper": [RIGHT, 53],
    "Left Trigger": [LEFT, 89],
    "Right Trigger": [RIGHT, 80],
    "Left Stick Y Axis": [LEFT, 128],
    "Left Stick X Axis": [LEFT, 156],
    "Left Stick Button": [LEFT, 186],
    "Y": [RIGHT, 114],
    "B": [RIGHT, 160],
    "X": [RIGHT, 182],
    "A": [RIGHT, 273],
    "D-pad Up": [LEFT, 292],
    "D-pad Left": [LEFT, 320],
    "D-pad Down": [LEFT, 347],
    "D-pad Right": [LEFT, 378],
    "Right Stick Y Axis": [RIGHT, 320],
    "Right Stick X Axis": [RIGHT, 347],
    "Right Stick Button": [RIGHT, 376],
};

let title = "";
let labels = {};

const controllerImage = new Image();
controllerImage.src = "controller-diagram.png";

function drawController() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(controllerImage, 0, 0, canvas.width, canvas.height);

    ctx.textBaseline = "middle";
    ctx.direction = "ltr";
    ctx.font = "32px Arial";
    ctx.fillText(title, 5, 18);

    for (const [button, position] of Object.entries(DEBUG ? buttonPositions : {})) {
        ctx.fillStyle = "red";
        ctx.font = "16px Arial";
        ctx.direction = position[0] === LEFT ? "rtl" : "ltr";
        ctx.fillText(`-------{${button}}------`, position[0], position[1] + 16/3);
    }

    for (const [button, label] of Object.entries(labels)) {
        const position = buttonPositions[button];
        if (position && label) {
            ctx.fillStyle = "#000";
            ctx.font = "16px Arial";
            ctx.direction = position[0] === LEFT ? "rtl" : "ltr";
            ctx.fillText(label, position[0], position[1] + 16/2.8);
        }
    }

    requestAnimationFrame(drawController);
}

function createLabelInputs() {
    const leftLabels = document.getElementById("left-labels");
    const rightLabels = document.getElementById("right-labels");

    for (const [button, position] of Object.entries(buttonPositions)) {
        const input = document.createElement("input");
        input.type = "text";
        input.title = input.placeholder = button;
        input.spellcheck = "true";

        input.addEventListener("input", (e) => {
            labels[button] = e.target.value.trim();
            saveState();
        });

        if (position[0] === LEFT) {
            leftLabels.appendChild(input);
        } else {
            rightLabels.appendChild(input);
        }
    }
}

function saveState() {
    const state = { title, labels };
    localStorage.setItem("controllerState", JSON.stringify(state));
}

function loadState() {
    const savedState = localStorage.getItem("controllerState");
    if (savedState) {
        const state = JSON.parse(savedState);
        updateState(state);
    }
}

function updateState(state) {
    title = state.title || "";
    labels = state.labels || {};

    document.getElementById("title-input").value = title;

    for (const [button, label] of Object.entries(labels)) {
        const input = document.querySelector(`input[placeholder="${button}"]`);
        if (input) {
            input.value = label;
        }
    }

    drawController();
}

function downloadJSON() {
    const data = { title, labels };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = getPageName() + ".json";
    link.click();
    
    URL.revokeObjectURL(url);
}

function loadJSON(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                setTimeout(() => event.target.value = null, 1000)
                updateState(data, false);
                saveState();
            } catch (error) {
                console.error("Error parsing JSON:", error);
                alert("Error loading JSON file. Please make sure it\"s a valid JSON file.");
            }
        };
        reader.readAsText(file);

    }
}

function getPageName() {
    return `${title || "default"}-controller-labeled`
}

function downloadImage() {
    const link = document.createElement("a");
    link.download = getPageName() + ".png";
    link.href = canvas.toDataURL();
    link.click();
}

function printImage() {
    const dataUrl = canvas.toDataURL();
    const windowContent = `
        <!DOCTYPE html>
        <html>
        <head><title>${title || "Default"} Controller Labeled</title></head>
        <body>
            <img src="${dataUrl}" style="width: 100%;">
        </body>
        </html>
    `;
    const printWindow = window.open(", ", "height=600,width=800");
    printWindow.document.write(windowContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

function resetState() {
    title = "";
    labels = {};
    document.getElementById('title-input').value = "";
    
    document.querySelectorAll('#left-labels input, #right-labels input').forEach(input => {
        input.value = "";
    });

    localStorage.removeItem('controllerState');
}


function updateState(state) {

    title = state.title || '';
    labels = state.labels || {};

    document.getElementById('title-input').value = title;

    document.querySelectorAll('#left-labels input, #right-labels input').forEach(input => {
        const button = input.placeholder;
        input.value = labels[button] || '';
    });

    drawController();
}

document.getElementById("title-input").addEventListener("input", (e) => {
    title = e.target.value;
    saveState();
});

document.getElementById('reset-button').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset? This will clear all labels and the title.')) {
        resetState();
    }
});

document.getElementById("download-button").addEventListener("click", downloadImage);
document.getElementById("print-button").addEventListener("click", printImage);
document.getElementById("download-json").addEventListener("click", downloadJSON);
document.getElementById("upload-json").addEventListener("change", loadJSON);

// Initialize
window.addEventListener("load", () => {
    createLabelInputs();
    loadState();
    drawController();
});