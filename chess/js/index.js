"use strict";

const boardWidth = 8;
const boardHeight = 8;

function generateAlphabet(capital = false) {
	return [...Array(26)].map((_, i) => String.fromCharCode(i + (capital ? 65 : 97)));
}

const alphbet = generateAlphabet();

const Colors = {
	WHITE: "white",
	BLACK: "black",
};

const neerSideColor = Colors.WHITE;

class Board {
	constructor(width, height, htmlTable) {
		this.width = width;
		this.height = height;

		this.boardArray = Array(this.height);
		this.boardTable = htmlTable;

		for (let i = 0; i < this.height; i++) {
			this.boardArray[i] = Array(width);
			const row = this.boardTable.insertRow();
			for (let j = 0; j < this.width; j++) {
				this.boardArray[i][j] = null;
				const cell = row.insertCell();

				cell.classList.add("tile");
				cell.classList.add((i + j) % 2 === 0 ? "light" : "dark");
				cell.title = toChessNotation(j, i);
			}
		}
	}

	clear() {
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				this.resetTile(x, y);
			}
		}
	}

	isInBoard(x, y) {
		return x > -1 && x < this.width && y > -1 && y < this.height;
	}

	isEmpty(x, y) {
		return this.get(x, y) === null;
	}

	resetTile(x, y) {
		this.set(x, y, null);
	}

	get(x, y) {
		return this.boardArray[this.height - y - 1][x];
	}

	markCell(x, y) {
		const cell = this.getTableCell(x, y);
		cell.classList.add("marked");
	}

	getTableCell(x, y) {
		return this.boardTable.rows[this.height - y - 1].cells[x];
	}

	set(x, y, value) {
		this.boardArray[this.height - y - 1][x] = value;
		this.getTableCell(x, y).innerHTML = value;
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
			(peice.board.isEmpty(curX, curY) || peice.board.get(curX, curY).color !== peice.color) &&
			this.condition(board, peice, curX, curY)
		) {
			moves.push([curX, curY]);

			going = this.canRepeat && peice.board.isEmpty(curX, curY);

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
	return `${alphbet[x]}${boardWidth - y}`;
}

function toCapitalized(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

class Peice {
	constructor(board, type, shortHandName, points, moves, color, x = 0, y = 0) {
		this.board = board;

		this.type = type;
		this.shortHandName = shortHandName;
		this.points = points;
		this.color = color;

		this.svg = document.createElement("img");
		this.svg.src = `peices/${this.color}_${this.type}.svg`;
		this.svg.alt = `${toCapitalized(color)} ${this.type}`;
		this.svg.width = 80;
		this.svg.height = 80;

		this.timesMoved = 0;

		if (this.color !== neerSideColor) moves = moves.map((m) => m.getReverseMove());

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
		[this.x, this.y] = [x, y];
		this.svg.title = `${this.type} ${toChessNotation(x, y)}`;
		this.board.set(x, y, this);
		this.possibleMoves = this.generatePossibleMoves();
	}

	moveTo(x, y) {
		this._setLocation(x, y);
		this.timesMoved++;
	}

	toString() {
		console.log(this.svg.outerHTML)
		return this.svg.outerHTML;
	}
}

function createPeiceSubclass(board, type, shortHandName, points, moves) {
	return class extends Peice {
		constructor(color, x = 0, y = 0) {
			super(board, type, shortHandName, points, moves, color, x, y);
		}
	};
}

// todo make move group creator that simplfies his code
const King = createPeiceSubclass(board, "king", "K", Infinity, [
	new Move(1, 1),
	new Move(0, 1),
	new Move(-1, 1),
	new Move(1, 0),
	new Move(-1, 0),
	new Move(1, -1),
	new Move(0, -1),
	new Move(-1, -1),
]);

const Pawn = createPeiceSubclass(board, "pawn", "", 1, [
	new Move(0, 1),
	new Move(1, 1, false, (board, peice, x, y) => !board.isEmpty(x, y) && board.get(x, y).color !== peice.color),
	new Move(-1, 1, false, (board, peice, x, y) => !board.isEmpty(x, y) && board.get(x, y).color !== peice.color),
	new Move(0, 2, false, (board, peice, x, y) => peice.timesMoved === 0),
]);

const Knight = createPeiceSubclass(board, "knight", "N", 3, [
	new Move(1, 2),
	new Move(2, 1),
	new Move(2, -1),
	new Move(-1, -2),
	new Move(-1, 2),
	new Move(-2, 1),
	new Move(-2, -1),
	new Move(1, -2),
]);

const Bishop = createPeiceSubclass(board, "bishop", "B", 3, [
	new Move(1, 1, true),
	new Move(-1, 1, true),
	new Move(1, -1, true),
	new Move(-1, -1, true),
]);

const Rook = createPeiceSubclass(board, "rook", "R", 5, [
	new Move(1, 0, true),
	new Move(-1, 0, true),
	new Move(0, 1, true),
	new Move(0, -1, true),
]);

const Queen = createPeiceSubclass(board, "queen", "Q", 9, [
	new Move(1, 1, true),
	new Move(0, 1, true),
	new Move(-1, 1, true),
	new Move(1, 0, true),
	new Move(-1, 0, true),
	new Move(1, -1, true),
	new Move(0, -1, true),
	new Move(-1, -1, true),
]);

const r = new Rook(Colors.WHITE, 1, 1);
const p = new Pawn(Colors.BLACK, 1, 5);
const q = new Pawn(Colors.BLACK, 1, 6);
for (const [x, y] of r.generatePossibleMoves()) {
	board.markCell(x, y);
}
