"use strict";

function sum(array, m = (v) => v) {
    return array.map(m).reduce((a, b) => (a + b), 0);
}

function min(array, m = (v) => v) {
    return Math.min(...array.map(m))
}

function max(array, m = (v) => v) {
	return Math.max(...array.map(m))
}

class Dice {
    constructor(min, max) {
        this.min = min;
        this.max = max;
        this.rangeSize = max - min + 1;
        this.range = Array.from({ length: this.rangeSize }, (_, i) => i + min);
        this.average = (max + min) / 2;
    }

    roll() {
        return Math.floor(Math.random() * this.rangeSize) + this.min;
    }
}

class DiceSet {
    constructor() {
        this.dice = [];
		this.diceElements = [];
    }

    rollAll() {
        const rolls = this.dice.map(die => die.roll());
        this.diceElements.forEach((diceElement, index) => {
            diceElement.valueElement.textContent = rolls[index];
        });
        return rolls;
    }
	
	createDiceDisplay(die, color) {
        const diceElement = document.createElement('div');
        diceElement.className = 'dice-display';
        diceElement.style.backgroundColor = color;
        
        const valueElement = document.createElement('div');
        valueElement.textContent = '?';
        diceElement.appendChild(valueElement);
        
        const rangeElement = document.createElement('div');
        rangeElement.className = 'dice-range';
        rangeElement.textContent = `${die.min}-${die.max}`;
        diceElement.appendChild(rangeElement);
        
        document.querySelector('.dice-container').appendChild(diceElement);
        this.diceElements.push({ element: diceElement, valueElement });
    }

    rollAll() {
        const rolls = this.dice.map(die => die.roll());
        this.diceElements.forEach((diceElement, index) => setTimeout(() => {
			diceElement.element.classList.add("rolling");
            setTimeout(() => diceElement.valueElement.textContent = rolls[index], 1000 * 0.5);
			setTimeout(() => diceElement.element.classList.remove("rolling"), 1000 * 0.7);
        }, index * 3));
        return rolls;
    }

    get minSum() {
        return sum(this.dice, d => d.min);
    }

    get maxSum() {
        return sum(this.dice, d => d.max);
    }

    get averageSum() {
        return sum(this.dice, d => d.average);
    }

    get minIndividual() {
        return min(this.dice, d => d.min);
    }

    get maxIndividual() {
        return max(this.dice, d => d.max);
    }

    get averageIndividual() {
        return sum(this.dice, d => d.average) / this.count;
    }

	get count() {
		return this.dice.length;
	}

    probabilitySum(comparison, value) {
        const totalOutcomes = Math.pow(6, this.dice.length);
        let favorableOutcomes = 0;

        for (let i = this.minSum; i <= this.maxSum; i++) {
            if (this.compareValue(i, comparison, value)) {
                favorableOutcomes += this.waysToGetSum(i);
            }
        }

        return favorableOutcomes / totalOutcomes;
    }

    probabilityIndividual(comparison, value) {
        const favorableDice = this.dice.filter(die => 
            this.compareValue(die.max, comparison, value) || 
            this.compareValue(die.min, comparison, value)
        );
        
        return favorableDice.length / this.dice.length;
    }

    expectedDiceCount(comparison, value) {
        return this.dice.reduce((count, die) => {
            const favorableOutcomes = die.range.filter(face => 
                this.compareValue(face, comparison, value)
            ).length;
            return count + (favorableOutcomes / die.rangeSize);
        }, 0);
    }

    compareValue(a, comparison, b) {
        switch (comparison) {
            case 'gt': return a > b;
            case 'lt': return a < b;
            case 'gte': return a >= b;
            case 'lte': return a <= b;
            case 'eq': return a === b;
            default: throw new Error('Invalid comparison');
        }
    }

    waysToGetSum(targetSum) {
        const memo = new Map();

        const recurse = (index, currentSum) => {
            if (index === this.dice.length) {
                return currentSum === targetSum ? 1 : 0;
            }

            const key = `${index},${currentSum}`;
            if (memo.has(key)) return memo.get(key);

            let ways = 0;
            for (let face of this.dice[index].range) {
                ways += recurse(index + 1, currentSum + face);
            }

            memo.set(key, ways);
            return ways;
        };

        return recurse(0, 0);
    }
}

const diceSet = new DiceSet();

function updateGeneralStats() {
	const minOutput = document.getElementById('gen-min');
	const maxOutput = document.getElementById('gen-max');
	const avgOutput = document.getElementById('gen-avg');
	const countOutput = document.getElementById('gen-count');
	if (document.querySelector('.value-title').value == "sum") {
		minOutput.textContent = diceSet.minSum;
		minOutput.parentElement.title = "Minimum possible sum of all dice";
		maxOutput.textContent = diceSet.maxSum;
		maxOutput.parentElement.title = "Maximum possible sum of all dice";
		avgOutput.textContent = diceSet.averageSum.toFixed(2);
		avgOutput.parentElement.title = "Average sum of all dice";
	} else {
		minOutput.textContent = diceSet.minIndividual;
		minOutput.parentElement.title = "Minimum possible value of any individual picked dice";
		maxOutput.textContent = diceSet.maxIndividual;
		maxOutput.parentElement.title = "Maximum possible value of any individual picked dice";
		avgOutput.textContent = diceSet.averageIndividual.toFixed(2);
		avgOutput.parentElement.title = "Average value of any individual picked dice";
	}
	countOutput.textContent = diceSet.count;
}

function updateNumberStats() {
    const comparisonSelect = document.getElementById('num-sum-stat-rle');
    const numberInput = document.getElementById('num-sum-stat-num');
    const comparison = comparisonSelect.value;
    const value = parseInt(numberInput.value, 10);

    if (!isNaN(value)) {
        let probability = diceSet.probabilitySum(comparison, value);

        document.getElementById('num-sum-avg').textContent = (probability * 100).toFixed(2);
    } else {
        document.getElementById('num-sum-avg').textContent = "?";
    }
}

function updateDiceCountStats() {
    const comparisonSelect = document.getElementById('num-stat-rle');
    const numberInput = document.getElementById('num-stat-num');
    const comparison = comparisonSelect.value;
    const value = parseInt(numberInput.value, 10);

    if (!isNaN(value)) {
        const expectedCount = diceSet.expectedDiceCount(comparison, value);
        document.getElementById('avg').textContent = expectedCount.toFixed(2);
        document.getElementById('avg-percent').textContent = ((expectedCount / diceSet.dice.length) * 100).toFixed(2);
    } else {
        document.getElementById('avg').textContent = "?";
        document.getElementById('avg-percent').textContent = "?";
    }
}


document.querySelector('.create-dice').addEventListener('submit', (e) => {
    e.preventDefault();
    const min = parseInt(document.getElementById('dice-create-min').value, 10);
    const max = parseInt(document.getElementById('dice-create-max').value, 10);
    const amount = parseInt(document.getElementById('dice-create-amount').value, 10);
    const color = document.getElementById('dice-color').value;

    if (!isNaN(min) && !isNaN(max) && !isNaN(amount) && min <= max) {
        for (let i = 0; i < amount; i++) {
            const die = new Dice(min, max);
            diceSet.dice.push(die);
            diceSet.createDiceDisplay(die, color);
        }
        updateGeneralStats();
        updateNumberStats();
        updateDiceCountStats();
    }
});

const rollButton = document.getElementById("roll-dice")
rollButton.addEventListener('click', () => diceSet.rollAll());

document.querySelector('.value-title').addEventListener('change', updateGeneralStats)

document.getElementById('num-sum-stat-rle').addEventListener('change', updateNumberStats);
document.getElementById('num-sum-stat-num').addEventListener('input', updateNumberStats);
document.querySelector('.value-title').addEventListener('change', updateNumberStats);

document.getElementById('num-stat-rle').addEventListener('change', updateDiceCountStats);
document.getElementById('num-stat-num').addEventListener('input', updateDiceCountStats);

updateGeneralStats();
updateNumberStats();
updateDiceCountStats();

// --- set up sidebar info containers ---
let lastMoved = undefined;
let zIndexMax = 0;
document.querySelectorAll(".info-container").forEach((container, index) => {
	const containerRect = container.getBoundingClientRect();
	const infoContainer = container.querySelector(".info");

	// add toggle
	{
		const label = container.querySelector(".info-container-toggle");
		label.addEventListener("click", toggle);

		const showArrow = "<";
		const hideArrow = ">";

		const showMessage = "show stats";
		const hideMessage = "hide stats";

		label.innerText = hideArrow;
		label.title = hideMessage;

		function toggle() {
			label.innerText = label.innerText === hideArrow ? showArrow : hideArrow;
			label.title = label.title === showMessage ? hideMessage : showMessage;
			container.classList.toggle("hidden");
		}

		// todo just start it hidden
		if (window.innerWidth < 800) toggle();
	}

	// add dragging
	{
		const statSectionTitle = infoContainer.querySelector(".stat-section-title");

		let isDown = false;
		let offset = 0;

		statSectionTitle.addEventListener("touchstart", dragStart, false);
		statSectionTitle.addEventListener("touchend", dragEnd, false);
		document.addEventListener("touchmove", drag, false);

		statSectionTitle.addEventListener("mousedown", dragStart, false);
		statSectionTitle.addEventListener("mouseup", dragEnd, false);
		document.addEventListener("mousemove", drag, false);

		function dragStart(event) {
			isDown = true;
			container.classList.add("grabbed");

			if (index !== lastMoved) {
				zIndexMax++;
				lastMoved = index;
				container.style.zIndex = zIndexMax;
			}

			offset = container.offsetTop - event.clientY;
		}

		function dragEnd(event) {
			isDown = false;
			container.classList.remove("grabbed");
		}

		const titleRect = statSectionTitle.getBoundingClientRect();
		const titleLeft = titleRect.x;
		const titleRight = titleRect.x + titleRect.width;

		function drag(event) {
			if (isDown) {
				if (event.clientX < titleLeft || event.clientX > titleRight) {
					dragEnd();
				}

				let newTop = event.clientY + offset;
				if (newTop < 0) {
					newTop = 1;
					dragEnd();
				} else if (newTop + containerRect.height > document.documentElement.clientHeight) {
					newTop = document.documentElement.clientHeight - containerRect.height;
					dragEnd();
				}

				container.style.top = newTop + "px";
			}
		}

	}
});

// -- add new dice ---
const form = document.querySelector(".create-dice");
form.addEventListener("submit", (event) => {
	event.preventDefault();

});

// --- class="num-only" ---
document.querySelectorAll("input.num-only").forEach((input) => {
	// TODO if deselected with no text set to default
	input.addEventListener("keypress", (event) => {
		if (!/[\d-]/.test(event.key)) {
			event.preventDefault();
			return false;
		}
	});
});

// --- class="value-title---" ---
document.querySelectorAll("select.value-title").forEach((select) => {
	const update = () => {
		let selected_option = null
		select.querySelectorAll("option").forEach((child) => {
			if (child.value === select.value) selected_option = child;
		})
		if (selected_option) select.title = selected_option.title;
	}

	select.addEventListener("change", update)
	update()
})


// --- dice input color change ---

const formDice = form.querySelector("#input-dice");
const inputDiceColor = formDice.querySelector("#dice-color");

inputDiceColor.addEventListener("input", (event) => {
	formDice.style.setProperty("--color", event.target.value);
});

// --- clear input font shrink ---
document.querySelectorAll(".clear-input").forEach((input) => {
	const originalFontSize = parseFloat(window.getComputedStyle(input).fontSize);
	const minFontSize = 8; // Minimum font size in pixels

	function adjustFontSize() {
		let fontSize = originalFontSize;
		input.style.fontSize = `${fontSize}px`;

		// Store the original dimensions
		const originalWidth = input.offsetWidth;
		const originalHeight = input.offsetHeight;

		while (input.scrollWidth > originalWidth && fontSize > minFontSize) {
			fontSize -= 0.5;
			input.style.fontSize = `${fontSize}px`;
		}

		// Restore the original dimensions
		input.style.width = `${originalWidth}px`;
		input.style.height = `${originalHeight}px`;
	}

	// Adjust font size on input
	input.addEventListener('input', adjustFontSize);

	// Adjust font size on window resize
	window.addEventListener('resize', adjustFontSize);

	// Initial adjustment
	adjustFontSize();
});