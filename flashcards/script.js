class FlashcardApp {
    constructor() {
        this.currentIndex = 0;
        this.flashcards = [];
        this.shuffleMode = false;
        this.frontIsTerm = true;

        this.initializeElements();
        this.attachEventListeners();
        this.updateCard();
        this.updateEditableCards();

        this.loadFrom();
    }

    initializeElements() {
        // Store DOM elements
        this.elements = {
            termsList: document.getElementById("terms-list"),
            card: document.getElementById("flashcard"),
            term: document.getElementById("term"),
            definition: document.getElementById("definition"),
            cardNumber: document.getElementById("card-number"),
            viewMode: document.getElementById("view-mode"),
            shuffleButton: document.getElementById("shuffle-button"),
            viewButton: document.getElementById("view-button"),
            downloadButton: document.getElementById("download-json"),
            uploadJsonFile: document.getElementById("upload-json"),
        };
    }

    attachEventListeners() {
        document.getElementById("prev-card-btn").addEventListener("click", () => this.prevCard());
        document.getElementById("next-card-btn").addEventListener("click", () => this.nextCard());
        this.elements.card.addEventListener("click", () => this.flipCard());

        this.elements.shuffleButton.addEventListener("click", () => this.toggleShuffleMode());
        this.elements.viewButton.addEventListener("click", () => this.toggleViewMode());
        document.getElementById("add-term-btn").addEventListener("click", () => this.addTerm());

        document.addEventListener("keydown", (event) => this.handleKeyPress(event));

        window.addEventListener("keydown", (event) => {
            if (event.target.tagName === "INPUT") return;
            if (event.key === " ") event.preventDefault();
        });

        this.elements.downloadButton.addEventListener("click", () => {
            const json = this.getAsJson();
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "flashcards.json";
            a.click();
            URL.revokeObjectURL(url);
        });

        this.elements.uploadJsonFile.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.loadFromJson(e.target.result);
                };
                reader.readAsText(file);
            }
        });


        document.querySelectorAll("button").forEach((button) => {
            button.addEventListener("mousedown", (event) => {
                event.preventDefault();
            });
        });
    }

    handleKeyPress(event) {
        if (event.target.tagName === "INPUT") return;

        const keyActions = {
            "Space": () => this.flipCard(),
            "ArrowLeft": () => this.prevCard(),
            "ArrowRight": () => this.nextCard()
        };

        const action = keyActions[event.code];
        if (action) action();
    }

    updateEditableCards() {
        this.elements.termsList.innerHTML = "";
        this.flashcards.forEach((flashcard, index) => {
            const editableCard = this.createEditableCard(flashcard, index);
            this.elements.termsList.appendChild(editableCard);
        });
    }

    createEditableCard(flashcard, index) {
        const editableCard = document.createElement("div");
        editableCard.classList.add("editable-card");

        const term = this.createInput("term", flashcard.term, index);
        const definition = this.createInput("definition", flashcard.definition, index);
        const deleteButton = this.createDeleteButton(index);

        editableCard.append(term, definition, deleteButton);
        return editableCard;
    }

    getAsJson() {
        return JSON.stringify(this.flashcards, null, 2);
    }

    loadFromJson(json) {
        try {
            this.flashcards = JSON.parse(json);
            this.currentIndex = 0;
        } catch (error) {
            alert("Invalid JSON format.");
        }
        this.updateCard(true);
        this.updateEditableCards();
    }

    saveTo() {
        const rawJson = this.getAsJson();
        const compressed = LZString.compressToEncodedURIComponent(rawJson);

        const url = new URL(window.location);
        url.search = "";
        const compressedUrl = new URL(url);
        compressedUrl.searchParams.set("state", compressed);

        const uncompressedUrl = new URL(url);
        const flashcards = this.flashcards;
        for (let i = 0; i < flashcards.length; i++) {
            uncompressedUrl.searchParams.append(flashcards[i].term, flashcards[i].definition);
        }

        const compressedLength = compressedUrl.toString().length;
        const uncompressedLength = uncompressedUrl.toString().length;

        let finalURL;

        if (compressedLength < uncompressedLength) {    
            console.log("Compressed URL is shorter, using it.");
            finalURL = compressedUrl.toString();
        } else {
            console.log("Uncompressed URL is shorter, using it.");
            finalURL = uncompressedUrl.toString();
        }

        if (finalURL.length < 2000) {
            console.log("Saving flashcards into URL.");
            window.history.replaceState({}, "", finalURL);
            this.enableCopyLinkButton(true);
        } else {
            console.warn("URL too long, not saving flashcards into URL.");
            url.search = "";
            window.history.replaceState({}, "", url);
            this.enableCopyLinkButton(false);
        }

        console.log("Saving to localStorage");
        localStorage.setItem("flashcards", rawJson);
    }

    loadFrom() {
        const params = new URLSearchParams(window.location.search);
        const compressedState = params.get("state");

        if (compressedState) {
            console.log("Loading from compressed URL");
            const json = LZString.decompressFromEncodedURIComponent(compressedState);
            if (json) {
                this.loadFromJson(json);
            } else {
                alert("Failed to decompress flashcard data from URL.");
            }
        } else if (Array.from(params.keys()).length > 0) {
            console.log("Loading from uncompressed URL");
            for (const [term, definition] of params) {
                this.flashcards.push({ term, definition });
            }
            this.updateCard(true);
            this.updateEditableCards();
        } else {
            console.log("No URL data, loading from localStorage");
            this.loadFromJson(localStorage.getItem("flashcards") || "[]");
        }
    }

    enableCopyLinkButton(enable) {
        const button = document.getElementById("copy-link-button");
        if (enable) {
            button.disabled = false;
            button.title = "Copy shareable link";
            button.style.opacity = 1;
        } else {
            button.disabled = true;
            button.title = "Too much data to share via link!";
            button.style.opacity = 0.5;
        }
    }

    createInput(type, value, index) {
        const input = document.createElement("input");
        input.value = value;
        input.classList.add(`editable-${type}`);
        input.title = `Click to edit ${type}`;

        input.addEventListener("input", (event) => {
            this.flashcards[index][type] = event.target.value;
            this.saveTo();
            this.updateCard(false);
        });

        return input;
    }

    createDeleteButton(index) {
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "❌";
        deleteButton.title = "Delete this term";
        deleteButton.addEventListener("click", () => {
            this.flashcards.splice(index, 1);
            this.currentIndex = Math.min(this.currentIndex, this.flashcards.length - 1);
            this.saveTo();
            this.updateCard(false);
            this.updateEditableCards();
        });
        return deleteButton;
    }

    addTerm() {
        const newIndex = this.flashcards.length + 1;
        this.flashcards.push({
            term: `New Term #${newIndex}`,
            definition: `New Definition #${newIndex}`
        });
        this.saveTo();
        this.updateCard(false);
        this.updateEditableCards();
        this.elements.termsList.lastElementChild.querySelector(".editable-term").focus();
    }

    flipCard() {
        this.elements.card.classList.toggle("flipped");
    }

    prevCard() {
        if (this.shuffleMode) {
            const currentIndex = this.currentIndex;
            while (this.currentIndex === currentIndex && this.flashcards.length > 1) {
                this.currentIndex = Math.floor(Math.random() * this.flashcards.length);
            }
        }
        else {
            this.currentIndex = (this.currentIndex - 1 + this.flashcards.length) % this.flashcards.length;
        }
        this.updateCard();

        this.elements.card.animate([
            { transform: "translateX(-5%)" },
            { transform: "translateX(0)" }
        ], { duration: 300, easing: "ease-out" })
    }

    nextCard() {
        if (this.shuffleMode) {
            const currentIndex = this.currentIndex;
            while (this.currentIndex === currentIndex && this.flashcards.length > 1) {
                this.currentIndex = Math.floor(Math.random() * this.flashcards.length);
            }
        }
        else {
            this.currentIndex = (this.currentIndex + 1) % this.flashcards.length;
        }
        this.updateCard();

        this.elements.card.animate([
            { transform: "translateX(5%)" },
            { transform: "translateX(0)" }
        ], { duration: 300, easing: "ease-out" })
    }

    toggleShuffleMode() {
        this.shuffleMode = !this.shuffleMode;
        this.elements.shuffleButton.textContent = `Shuffle: ${this.shuffleMode ? "On" : "Off"}`;
    }

    toggleViewMode() {
        this.frontIsTerm = !this.frontIsTerm;
        this.elements.viewButton.textContent = `Front: ${this.frontIsTerm ? "Term" : "Definition"}`;
        this.updateCard();
    }

    updateCard(unFlip = true) {
        if (unFlip) {
            this.elements.card.classList.remove("flipped");
        }

        if (this.flashcards.length < 1) {
            this.updateEmptyState();
        } else {
            this.updateCardContent();
        }
    }

    updateEmptyState() {
        this.currentIndex = 0;
        this.elements.term.textContent = "No term.";
        this.elements.definition.textContent = "Add a term in list below.";
        this.elements.cardNumber.textContent = "No cards";
        this.elements.viewMode.textContent = this.frontIsTerm ? "Term" : "Definition";
    }

    updateCardContent() {
        const currentCard = this.flashcards[this.currentIndex];
        this.elements.term.textContent = this.frontIsTerm ? currentCard.term : currentCard.definition;
        this.elements.definition.textContent = this.frontIsTerm ? currentCard.definition : currentCard.term;
        this.elements.cardNumber.textContent = `${this.currentIndex + 1}/${this.flashcards.length}`;
        this.elements.viewMode.textContent = this.frontIsTerm ? "Term" : "Definition";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new FlashcardApp();
});

document.getElementById("hide").addEventListener("click", (event) => {
    const element = document.getElementById("terms-list");
    element.classList.toggle("hide")
    event.target.textContent = element.classList.contains("hide") ? "Show List" : "Hide List";
});