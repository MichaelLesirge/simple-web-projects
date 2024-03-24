export default class KeyboardInputManager {
    constructor(map) {
        this.map = map;

        this.events = {};
        this.listen();
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    emit(event, data) {
        const callbacks = this.events[event];
        if (callbacks) {
            callbacks.forEach(callback => {
                callback(data);
            });
        }
    }

    listen() {
        const self = this;

        document.addEventListener("keydown", event => {
            const modifiers = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
            const mapped = this.map[event.key];

            if (!modifiers) {
                if (mapped !== undefined) {
                    event.preventDefault();
                    self.emit("move", mapped);
                }

                if (event.key === " ") self.restart(event);
            }
        });

        const retry = document.querySelector(".retry-button");
        retry.addEventListener("click", this.restart.bind(this));
        retry.addEventListener("touchend", this.restart.bind(this));

        const keepPlaying = document.querySelector(".keep-playing-button");
        keepPlaying.addEventListener("click", this.keepPlaying.bind(this));
        keepPlaying.addEventListener("touchend", this.keepPlaying.bind(this));

        const touchStart = { x: 0, y: 0 };
        const gameContainer = document.querySelector(".game-container");

        gameContainer.addEventListener("touchstart", event => {
            if (event.touches.length > 1) return;

            touchStart.x = event.touches[0].clientX;
            touchStart.y = event.touches[0].clientY;
            event.preventDefault();
        });

        gameContainer.addEventListener("touchmove", event => {
            event.preventDefault();
        });

        gameContainer.addEventListener("touchend", event => {
            if (event.touches.length > 0) return;

            const dx = event.changedTouches[0].clientX - touchStart.x;
            const absDx = Math.abs(dx);

            const dy = event.changedTouches[0].clientY - touchStart.y;
            const absDy = Math.abs(dy);

            if (Math.max(absDx, absDy) > 10) {
                // (right : left) : (down : up)
                self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
            }
        });
    }

    restart(event) {
        event.preventDefault();
        this.emit("restart");
    }

    keepPlaying(event) {
        event.preventDefault();
        this.emit("keepPlaying");
    }
}
