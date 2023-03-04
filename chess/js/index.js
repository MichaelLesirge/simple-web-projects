"use strict";

const boardWidth = 8;
const boardHeight = 8;

const Colors = {
	WHITE: "white",
	BLACK: "black",
};

const neerSideColor = Colors.WHITE;

class Cell {
	constructor(x, y, htmlTableCell) {
		this.x = x;
		this.y = y;
		this.HTMLcell = htmlTableCell;

		this.HTMLcell.classList.add("tile");
		this.HTMLcell.classList.add((y + x) % 2 === 0 ? "light" : "dark");
		this.HTMLcell.title = toChessNotation(x, y);

		this.set(null);
	}

	reset() {
		this.unmark();
		this.set(null);
	}

	set(value) {
		this.HTMLcell.innerHTML = value ?? "";
		this.value = value;
	}

	isEmpty() {
		return this.value === null;
	}

	mark() {
		this.HTMLcell.classList.add("marked");
	}

	unmark() {
		this.HTMLcell.classList.remove("marked");
	}
}

class Board {
	constructor(width, height, htmlTable) {
		this.width = width;
		this.height = height;

		this.selected = null;

		this.boardArray = Array(this.height);

		this.boardTable = htmlTable;

		for (let y = 0; y < this.height; y++) {
			this.boardArray[y] = Array(width);
			const row = this.boardTable.insertRow();
			for (let x = 0; x < this.width; x++) {
				const cell = new Cell(x, this.height - y - 1, row.insertCell());
				this.boardArray[y][x] = cell;

				cell.HTMLcell.addEventListener("click", (e) => {
					this.resetMarks();
					if (cell.value) {
						for (const [x, y] of cell.value.generatePossibleMoves()) {
							board.get(x, y).mark();
						}
					}
				});
			}
		}
	}

	resetMarks() {
		this.forEach((cell) => cell.unmark());
	}

	reset() {
		this.forEach((cell) => cell.reset());
	}

	isInBoard(x, y) {
		return x > -1 && x < this.width && y > -1 && y < this.height;
	}

	get(x, y) {
		return this.boardArray[this.height - y - 1][x];
	}

	forEach(func) {
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				func(this.get(x, y));
			}
		}
	}
}

const board = new Board(boardWidth, boardHeight, document.querySelector("table.board"));

class Move {
	constructor(xChange, yChange, canRepeat = false, condition = (board, peice, x, y) => true) {
		this.xChange = xChange;
		this.yChange = yChange;

		this.canRepeat = canRepeat;

		this.condition = condition;
	}

	generateMoves(peice) {
		const moves = [];
		let curX = peice.x + this.xChange;
		let curY = peice.y + this.yChange;

		let going = true;

		while (
			going &&
			peice.board.isInBoard(curX, curY) &&
			(peice.board.get(curX, curY).isEmpty() || peice.board.get(curX, curY).value.color !== peice.color) &&
			this.condition(board, peice, curX, curY)
		) {
			moves.push([curX, curY]);

			going = this.canRepeat && peice.board.get(curX, curY).isEmpty();

			curX += this.xChange;
			curY += this.yChange;
		}
		return moves;
	}

	getReverseMove() {
		return new Move(this.xChange, -this.yChange, this.canRepeat, this.condition);
	}
}

function toChessNotation(x, y) {
	return `${String.fromCharCode(x + "a".charCodeAt(0))}${y + 1}`;
}

function toCapitalized(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

class Peice {
	constructor(board, type, shortHandName, points, directional, moves, color, x = 0, y = 0) {
		this.board = board;

		this.type = type;
		this.shortHandName = shortHandName;
		this.points = points;
		this.color = color;

		this.svg = document.createElement("img");
		this.svg.src = `peices/${this.color}/${this.type}.svg`;
		this.svg.alt = `${toCapitalized(color)} ${this.type}`;
		this.svg.style.width = "100%";
		this.svg.style.height = "100%";

		this.timesMoved = 0;

		if (directional && this.color !== neerSideColor) moves = moves.map((m) => m.getReverseMove());

		this.moves = moves;

		this._setLocation(x, y);
	}

	generatePossibleMoves() {
		const moves = [];
		for (const move of this.moves) {
			moves.push(...move.generateMoves(this));
		}
		return moves;
	}

	_setLocation(x, y) {
		if (this.x !== undefined && this.y !== undefined) {
			this.board.resetTile(x, y);
		}
		[this.x, this.y] = [x, y];
		this.board.get(x, y).set(this);
		this.possibleMoves = this.generatePossibleMoves();
	}

	moveTo(x, y) {
		this._setLocation(x, y);
		this.timesMoved++;
	}

	toString() {
		return this.svg.outerHTML;
	}
}

function createPeiceSubclass(board, type, shortHandName, points, moves, directional = false) {
	return class extends Peice {
		constructor(color, x = 0, y = 0) {
			super(board, type, shortHandName, points, directional, moves, color, x, y);
		}
	};
}

function makeMoveVariations(xChange, yChange, canRepeat = false, condition = (board, peice, x, y) => true) {
	return [
		new Move(xChange, yChange, canRepeat, condition),
		new Move(-xChange, yChange, canRepeat, condition),
		new Move(xChange, -yChange, canRepeat, condition),
		new Move(-xChange, -yChange, canRepeat, condition),
	];
}

// todo make move group creator that simplfies his code
const King = createPeiceSubclass(board, "king", "K", Infinity, [
	...makeMoveVariations(1, 1),
	...makeMoveVariations(0, 1),
	...makeMoveVariations(1, 0),
]);

const Pawn = createPeiceSubclass(
	board,
	"pawn",
	"",
	1,
	[
		new Move(0, 1, false),
		new Move(1, 1, false, (board, peice, x, y) => !board.get(x, y).isEmpty() && board.get(x, y).color !== peice.color),
		new Move(-1, 1, false, (board, peice, x, y) => !board.get(x, y).isEmpty() && board.get(x, y).color !== peice.color),
		new Move(0, 2, false, (board, peice, x, y) => peice.timesMoved === 0),
	],
	true
);

const Knight = createPeiceSubclass(board, "knight", "N", 3, [...makeMoveVariations(1, 2), ...makeMoveVariations(2, 1)]);

const Bishop = createPeiceSubclass(board, "bishop", "B", 3, [...makeMoveVariations(1, 1, true)]);

const Rook = createPeiceSubclass(board, "rook", "R", 5, [...makeMoveVariations(0, 1, true), ...makeMoveVariations(1, 0, true)]);

const Queen = createPeiceSubclass(board, "queen", "Q", 9, [
	...makeMoveVariations(1, 1, true),
	...makeMoveVariations(0, 1, true),
	...makeMoveVariations(1, 0, true),
]);

const r = new Rook(Colors.WHITE, 1, 1);
const p1 = new Pawn(Colors.BLACK, 1, 6);
const p2 = new Pawn(Colors.BLACK, 4, 3);
const b1 = new Bishop(Colors.BLACK, 6, 1);
const b2 = new Bishop(Colors.BLACK, 5, 1);
const n = new Knight(Colors.BLACK, 4, 4);
const k = new King(Colors.BLACK, 7, 7);
