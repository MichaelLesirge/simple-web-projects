class FlashcardApp {
    constructor() {
        this.currentIndex = 0;
        this.flashcards = [
            { term: "HTML", definition: "A standard markup language used to create web pages." },
            { term: "CSS", definition: "A style sheet language used to describe the presentation of a document." },
            { term: "JavaScript", definition: "A programming language used for web development." },
        ];
        this.shuffleMode = false;
        this.frontIsTerm = true;

        this.initializeElements();
        this.attachEventListeners();
        this.updateCard();
        this.updateEditableCards();
        
        this.loadFromLocalStorage();
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
            viewButton: document.getElementById("view-button")
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

    saveToLocalStorage() {
        localStorage.setItem("flashcards", this.getAsJson());
    }

    loadFromLocalStorage() {
        this.loadFromJson(localStorage.getItem("flashcards") || "[]");
    }

    createInput(type, value, index) {
        const input = document.createElement("input");
        input.value = value;
        input.classList.add(`editable-${type}`);
        input.title = `Click to edit ${type}`;

        input.addEventListener("input", (event) => {
            this.flashcards[index][type] = event.target.value;
            this.saveToLocalStorage();
            this.updateCard(false);
        });

        return input;
    }

    createDeleteButton(index) {
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "❌";
        deleteButton.addEventListener("click", () => {
            this.flashcards.splice(index, 1);
            this.currentIndex = Math.min(this.currentIndex, this.flashcards.length - 1);
            this.saveToLocalStorage();
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
        this.saveToLocalStorage();
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