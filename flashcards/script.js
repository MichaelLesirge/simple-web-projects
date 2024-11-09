
let currentIndex = 0;
let flashcards = [
    { term: "HTML", definition: "A standard markup language used to create web pages" },
    { term: "CSS", definition: "A style sheet language used to describe the presentation of a document" },
    { term: "JavaScript", definition: "A programming language used for web development" },
];

const termsList = document.getElementById("terms-list");

function updateEditableCards() {
    termsList.innerHTML = "";
    flashcards.forEach((flashcard, index) => {
        const editableCard = document.createElement("div");
        editableCard.classList.add("editable-card");
        const term = document.createElement("input")
        const definition = document.createElement("input")
        term.value = flashcard.term;
        term.classList.add("editable-term");
        term.title = "Click to edit title";
        definition.value = flashcard.definition;
        definition.classList.add("editable-definition");
        definition.title = "Click to edit definition";
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "❌";
        term.addEventListener("input", (event) => {
            flashcards[index].term = event.target.value;
            updateCard();
        });
        definition.addEventListener("input", (event) => {
            flashcards[index].definition = event.target.value;
            updateCard();
        });
        editableCard.appendChild(term);
        editableCard.appendChild(definition);
        editableCard.appendChild(deleteButton);
        deleteButton.addEventListener("click", () => {
            flashcards.splice(index, 1);
            currentIndex = Math.min(currentIndex, flashcards.length - 1);
            updateCard(false);
            updateEditableCards();
        });
        termsList.appendChild(editableCard);
    });
}

function addTerm() {
    flashcards.push({ term: `New Term #${flashcards.length + 1}`, definition: `New Definition #${flashcards.length + 1}` });
    updateEditableCards();
}

updateEditableCards();

document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("mousedown", (event) => {
        event.preventDefault();
    });
});

window.addEventListener('keydown', (e) => {
    if (e.keyCode == 32 && e.target == document.body) {
        e.preventDefault();
    }
});

let shuffleMode = false;
let frontIsTerm = true;

function flipCard() {
    document.querySelector(".card").classList.toggle("flipped");
}

function prevCard() {
    currentIndex = (currentIndex - 1 + flashcards.length) % flashcards.length;
    updateCard();
}

function nextCard() {
    currentIndex = (currentIndex + 1) % flashcards.length;
    updateCard();
}

function toggleShuffleMode() {
    // TODO: revert to not shuffled when unshuffled 
    shuffleMode = !shuffleMode;
    document.getElementById("shuffle-button").textContent = `Shuffle: ${shuffleMode ? "On" : "Off"}`;
    if (shuffleMode) {
        shuffleCards();
    } else {
        currentIndex = 0;
        updateCard();
    }
}

function toggleViewMode() {
    frontIsTerm = !frontIsTerm;
    document.getElementById("view-button").textContent = `Front: ${frontIsTerm ? "Term" : "Definition"}`;
    updateCard();
}

function shuffleCards() {
    for (let i = flashcards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
    }
    currentIndex = 0;
    updateCard();
}

function updateCard(unFlip = true) {
    if (unFlip) {
        document.querySelector(".card").classList.remove("flipped");
    }
    if (flashcards.length < 1) {
        currentIndex = 0;
        document.getElementById("term").textContent = "No term.";
        document.getElementById("definition").textContent = "Add a term in list below.";
        document.getElementById("card-number").textContent = `No cards`;
        document.getElementById("view-mode").textContent = frontIsTerm ? "Term" : "Definition";
    }
    else {
        document.getElementById("term").textContent = frontIsTerm ? flashcards[currentIndex].term : flashcards[currentIndex].definition;
        document.getElementById("definition").textContent = frontIsTerm ? flashcards[currentIndex].definition : flashcards[currentIndex].term;
        document.getElementById("card-number").textContent = `${currentIndex + 1}/${flashcards.length}`;
        document.getElementById("view-mode").textContent = frontIsTerm ? "Term" : "Definition";
    }
}

document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        flipCard();
    } else if (event.code === "ArrowLeft") {
        prevCard();
    } else if (event.code === "ArrowRight") {
        nextCard();
    }
});

updateCard();