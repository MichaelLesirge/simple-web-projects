import GameManager from "./gameManager.js";
import Grid from "./board.js";
import KeyboardInputManager from "./keyboardInputManager.js";
import HTMLActuator from "./htmlActuator.js";
import LocalStorageManager from "./localStorageManager.js";

const base = 2;
requestAnimationFrame(() =>
    new GameManager(
        new Grid(4, 4),
        new KeyboardInputManager({
            "ArrowUp": 0, // Arrows
            "ArrowRight": 1,
            "ArrowDown": 2,
            "ArrowLeft": 3,
            "k": 0, // Vim keybindings
            "l": 1,
            "j": 2,
            "h": 3,
            "w": 0, // Game Controls
            "d": 1,
            "s": 2,
            "a": 3
        }),
        new HTMLActuator(
            document.getElementById("grid"),
            document.getElementById("score"),
            document.getElementById("best"),
            document.getElementById("game-message"),
            base,
        ),
        new LocalStorageManager("bestScore", 0),
        {startTiles: 2, tileStartValueBag: {2: 9, 4: 1}}
    )
);