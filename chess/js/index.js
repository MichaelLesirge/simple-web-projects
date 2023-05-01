"use strict";

const boardWidth = 8;
const boardHeight = 8;

const Colors = {
	WHITE: "white",
	BLACK: "black",
};

const neerSideColor = Colors.WHITE;

class Cell {
	constructor(row, col, htmlTableCell) {
		this.x = row;
		this.y = col;
		this.HTMLcell = htmlTableCell;

		this.HTMLcell.classList.add("tile");
		this.HTMLcell.classList.add((col + row) % 2 === 0 ? "light" : "dark");
		this.HTMLcell.title = toChessNotation(row, col);

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

		for (let row = 0; row < this.height; row++) {
			this.boardArray[row] = Array(width);
			const tableRow = this.boardTable.insertRow();
			for (let col = 0; col < this.width; col++) {
				const cell = new Cell(col, this.height - row - 1, tableRow.insertCell());
				this.boardArray[row][col] = cell;

				cell.HTMLcell.addEventListener("click", (e) => {
					this.resetMarks();
					if (cell.value) {
						this.selected = cell.value;
						for (const [row, col] of this.selected.generatePossibleMoves()) {
							board.get(row, col).mark();
						}
					}
					else {
						this.selected = null;
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

	resetTile(row, col) {
		this.get(row, col).reset();
	}

	isInBoard(row, col) {
		return row > -1 && row < this.width && col > -1 && col < this.height;
	}

	get(row, col) {
		return this.boardArray[this.height - col - 1][row];
	}

	forEach(func) {
		for (let row = 0; row < this.width; row++) {
			for (let col = 0; col < this.height; col++) {
				func(this.get(row, col));
			}
		}
	}
}

const board = new Board(boardWidth, boardHeight, document.querySelector("table.board"));

class Move {
	constructor(rowChange, colChange, canRepeat = false, condition = (board, peice, row, col) => true) {
		this.rowChange = rowChange;
		this.colChange = colChange;

		this.canRepeat = canRepeat;

		this.condition = condition;
	}

	generateMoves(peice) {
		const moves = [];
		let curRow = peice.row + this.rowChange;
		let curCol = peice.col + this.colChange;

		let going = true;

		while (
			going &&
			peice.board.isInBoard(curRow, curCol) &&
			(peice.board.get(curRow, curCol).isEmpty() || peice.board.get(curRow, curCol).value.color !== peice.color) &&
			this.condition(board, peice, curRow, curCol)
		) {
			moves.push([curRow, curCol]);

			going = this.canRepeat && peice.board.get(curRow, curCol).isEmpty();

			curRow += this.rowChange;
			curCol += this.colChange;
		}
		return moves;
	}

	getReverseMove() {
		return new Move(this.rowChange, -this.colChange, this.canRepeat, this.condition);
	}
}

function toChessNotation(row, col) {
	return `${String.fromCharCode(row + "a".charCodeAt(0))}${col + 1}`;
}

function toCapitalized(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

class Piece {
	constructor(board, type, shortHandName, points, directional, moves, color, row, col) {
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

		this._setLocation(row, col);
	}

	generatePossibleMoves() {
		const moves = [];
		for (const move of this.moves) {
			moves.push(...move.generateMoves(this));
		}
		return moves;
	}

	_setLocation(row, col) {
		if (this.row !== undefined && this.col !== undefined) {
			this.board.resetTile(this.row, this.col);
		}
		[this.row, this.col] = [row, col];
		this.board.get(row, col).set(this);
		this.possibleMoves = this.generatePossibleMoves();
	}

	moveTo(row, col) {
		this._setLocation(row, col);
		this.timesMoved++;
	}

	toString() {
		return this.svg.outerHTML;
	}
}

function createPeiceSubclass(board, type, shortHandName, points, moves, directional = false) {
	return class extends Piece {
		constructor(color, row = 0, col = 0) {
			super(board, type, shortHandName, points, directional, moves, color, row, col);
		}
	};
}

function makeMoveVariations(rowChange, colChange, canRepeat = false, condition = (board, peice, row, col) => true) {
	return [
		new Move(rowChange, colChange, canRepeat, condition),
		new Move(-rowChange, colChange, canRepeat, condition),
		new Move(rowChange, -colChange, canRepeat, condition),
		new Move(-rowChange, -colChange, canRepeat, condition),
	];
}

// todo make move group creator that simplfies his code
const King = createPeiceSubclass(board, "king", "K", Infinity, [
	...makeMoveVariations(1, 1),
	...makeMoveVariations(0, 1),
	...makeMoveVariations(1, 0),
]);

const Pawn = createPeiceSubclass(board, "pawn", "", 1, [
		new Move(0, 1, false),
		new Move(1, 1, false, (board, peice, x, y) => !board.get(x, y).isEmpty() && board.get(x, y).color !== peice.color),
		new Move(-1, 1, false, (board, peice, x, y) => !board.get(x, y).isEmpty() && board.get(x, y).color !== peice.color),
		new Move(0, 2, false, (board, peice, x, y) => peice.timesMoved === 0),
	], true
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

setTimeout(() => k.moveTo(6, 6), 2000)