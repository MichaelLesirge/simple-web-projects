const canvas = document.getElementById("controllerCanvas");
const ctx = canvas.getContext("2d");

const controllerImage = new Image();
controllerImage.src = "controller-diagram.png";

const DEBUG = false;

const distanceFromCenter = 165;

const LEFT = canvas.width / 2 - distanceFromCenter;
const RIGHT = canvas.width / 2 + distanceFromCenter - 6;

const version = "1.0.0";

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

const defaultState = {
    title: "",
    titleColor: "#000000",
    titleAlign: "left",
    labels: {}
}

function getExtraData() {
    return {
        "iso": new Date().toISOString(),
        "date": new Date().toLocaleString(),
        "sourceHref": document.location.href,
        "sourceName": "michaellesirge.github.io",
        "version": version
    }
}

let state = structuredClone(defaultState);

function drawController() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(controllerImage, 0, 0, canvas.width - 6, canvas.height);

    ctx.textBaseline = "middle";
    ctx.font = "32px Arial";
    ctx.fillStyle = state.titleColor || "#000000";

    if (state.titleAlign === "right") {
        ctx.textAlign = "right";
        ctx.fillText(state.title, canvas.width - 5, 18);
    } else if (state.titleAlign === "center") {
        ctx.textAlign = "center";
        ctx.fillText(state.title, canvas.width / 2, 18);
    }
    else {
        ctx.textAlign = "left";
        ctx.fillText(state.title, 5, 18);
    }

    if (DEBUG) {
        for (const [button, position] of Object.entries(buttonPositions)) {
            ctx.fillStyle = "red";
            ctx.font = "16px Arial";
            ctx.textAlign = "start";
            ctx.fillText(`-------{${button}}------`, position[0], position[1] + 16 / 3);
        }

        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
    }

    for (const [button, label] of Object.entries(state.labels)) {
        const position = buttonPositions[button];
        if (position && label) {
            ctx.fillStyle = "#000";
            ctx.font = "16px Arial";
            ctx.textAlign = position[0] === LEFT ? "end" : "start";
            ctx.fillText(label, position[0], position[1] + 16 / 2.8);
        }
    }

    requestAnimationFrame(drawController);
}

function createLabelInputs() {
    const leftLabels = document.getElementById("left-labels");
    const rightLabels = document.getElementById("right-labels");

    for (const [buttonName, position] of Object.entries(buttonPositions)) {
        const input = document.createElement("input");
        const label = document.createElement("label");

        input.type = "text";
        input.spellcheck = "true";
        input.lang = "en";

        input.id = input.title = input.placeholder = buttonName;

        label.for = input.id;
        label.textContent = buttonName;

        input.addEventListener("input", (e) => {
            state.labels[buttonName] = e.target.value.trim();
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
    localStorage.setItem("controllerState", JSON.stringify(state));
}

function loadState() {
    const savedState = localStorage.getItem("controllerState");

    if (savedState) {
        const state = JSON.parse(savedState);
        updateState(state);
    }
}

function updateState(newState) {

    const title = newState.title || "";
    const titleColor = newState.titleColor || "";
    const titleAlign = newState.titleAlign || "left";
    const labels = newState.labels || {};

    document.getElementById("title-input").value = title;
    document.getElementById("title-color").value = titleColor;
    document.getElementById("title-position").value = titleAlign;
    
    for (const [button, label] of Object.entries(labels)) {
        const input = document.querySelector(`input[placeholder="${button}"]`);
        if (input) input.value = label;
    }

    state = {
        title: title,
        titleColor: titleColor,
        titleAlign: titleAlign,
        labels: labels
    };

    drawController();
}

function resetState() {
    updateState(defaultState)
}

function downloadJSON() {

    const jsonString = JSON.stringify({...state, ...getExtraData()}, null, 2);

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
        reader.onload = function (e) {
            try {
                const newState = JSON.parse(e.target.result);
                setTimeout(() => event.target.value = null, 1000)
                updateState(newState, false);
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
    return toKebabCase(`${(state.title || "xbox").trim()} controller labeled`)
}

function downloadImage() {
    const link = document.createElement("a");
    link.download = getPageName() + ".png";
    link.href = canvas.toDataURL();
    link.click();
}

function printImage() {
    // const dataUrl = canvas.toDataURL();
    // const windowContent = `
    //     <!DOCTYPE html>
    //     <html>
    //     <head><title>${title || "Default"} Controller Labeled</title></head>
    //     <body>
    //         <img src="${dataUrl}" style="width: 100%;">
    //     </body>
    //     </html>
    // `;
    // const printWindow = window.open(", ", "height=600,width=800");
    // printWindow.document.write(windowContent);
    // printWindow.document.close();
    // printWindow.focus();
    // printWindow.print();
    // printWindow.close();
    print()
}

document.getElementById("title-input").addEventListener("input", (e) => {
    state.title = e.target.value;
    saveState();
});

document.getElementById("title-color").addEventListener("input", (e) => {
    state.titleColor = e.target.value;
    saveState();
});

document.getElementById("title-position").addEventListener("change", (e) => {
    state.titleAlign = e.target.value;
    saveState();
});

document.getElementById('reset-button').addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset? This will clear all labels and the title.')) {
        resetState();
    }
});

document.getElementById("download-button").addEventListener("click", downloadImage);
document.getElementById("print-button").addEventListener("click", printImage);
document.getElementById("download-json").addEventListener("click", downloadJSON);
document.getElementById("upload-json").addEventListener("change", loadJSON);

window.addEventListener("load", () => {
    createLabelInputs();
    loadState();
    drawController();
});


function updateTheme() {
    let value = localStorage.getItem("theme") ?? "system";

    if (value === "system") {
        value = window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
    }

    if (value === "dark") {
        document.body.classList.add("dark");
    }
    else {
        document.body.classList.remove("dark");
    }
}

document.getElementById("theme").addEventListener("input", (e) => {
    localStorage.setItem("theme", e.target.value);
    updateTheme();
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener("change", updateTheme)

document.getElementById("theme").value = localStorage.getItem("theme") ?? "system";
updateTheme();

const buttonCode = {
    "View": "start()",
    "Menu": "back()",
    "Left Bumper": "leftBumper()",
    "Right Bumper": "rightBumper()",
    "Left Trigger": "leftTrigger()",
    "Right Trigger": "rightTrigger()",
    "Left Stick Y Axis": "getLeftY()",
    "Left Stick X Axis": "getLeftX()",
    "Left Stick Button": "leftStick()",
    "Y": "y()",
    "B": "b()",
    "X": "x()",
    "A": "a()",
    "D-pad Up": "povUp()",
    "D-pad Left": "povLeft()",
    "D-pad Down": "povDown()",
    "D-pad Right": "povRight()",
    "Right Stick Y Axis": "getRightY()",
    "Right Stick X Axis": "getLeftX()",
    "Right Stick Button": "rightStick()",
};

String.prototype.toCapitalized = function () {
	return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

function convertString(text, func, split_separator = "", join_separator = undefined) {
	return text.split(split_separator).map(func).join(join_separator ?? split_separator)
}

function toPascalCase(text) {
    return convertString(text, (word) => word.toCapitalized(), " ", "");
}

function toCamelCase(text) {
    return convertString(text, (word, index) => (index === 0 ? word.toLowerCase() : word.toCapitalized()), " ", "");
}

function toKebabCase(text) {
    return convertString(text, (word, index) => word.toLowerCase(), " ", "-");
}

function toSentence(text) {
    return convertString(text, (word, index) => (index === 0 ? word.toCapitalized() : word.toLowerCase()), " ", " ");
}

function createJavaReference() {

    const controllerName = toCamelCase((state.title || "xbox") + " controller");

    const lines = []

    for (const [type, comment] of Object.entries(state.labels)) {

        if (comment.trim().length < 1) {
            continue;
        }

        lines.push({
            comment: `${toSentence(comment)} ${type.includes("Axis") ? "axis" : "button"}`,
            code: controllerName + "." + buttonCode[type] + ";",
        })
    }

    let text = "";

    const tabs = 2;

    for (const line of lines) {
        text += `${'\t'.repeat(tabs)}// ${line.comment}\n`
        text += `${'\t'.repeat(tabs)}${line.code}\n`
        text += "\n"
    }

    const extraData = getExtraData();
   
    return  `package frc.robot;

import edu.wpi.first.wpilibj2.command.Command;
import edu.wpi.first.wpilibj2.command.Commands;
import edu.wpi.first.wpilibj2.command.button.CommandXboxController;

// This file was auto generated by Xbox Diagram Maker
// Title: ${state.title || "Xbox Controller"} Mapping Reference
// Version: ${version}
// Date: ${extraData.date} (${extraData.iso})
// Source: ${extraData.sourceName} (${extraData.sourceHref})

public class RobotContainer {

\tprivate final CommandXboxController ${controllerName} =
\t\tnew CommandXboxController(0);

\tpublic RobotContainer() {
\t\tconfigureBindings();
\t}

\tprivate void configureBindings() {
\t\t${text.trim()}
\t}

\tpublic Command getAutonomousCommand() {
\t\treturn Commands.none();
\t}
}`
}

function createJavaReferenceObject() {
    const fileContent = createJavaReference();
    const file = new Blob([fileContent], {type: 'text/plain'});

    return (window.URL || window.webkitURL).createObjectURL(file)
}

document.getElementById("download-java").addEventListener("click", () => {
    const link = document.createElement("a");
    link.setAttribute("href", createJavaReferenceObject());
    link.setAttribute("download", toPascalCase((state.title || "xbox") + " mapping reference") + ".java");
    link.click();
});