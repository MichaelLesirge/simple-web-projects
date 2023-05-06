"use strict";

const boardWidth = 8;
const boardHeight = 8;

const PlayerColors = {
	WHITE: "white",
	BLACK: "black",
};

const neerSideColor = PlayerColors.WHITE;
const startingColor = PlayerColors.WHITE;

const SquareColors = {
	LIGHT: "light",
	DARK: "dark",
};


class Square {
	constructor(row, col, color, htmlTableCell, selectedListener, takenListener) {
		this.row = row;
		this.col = col;
		this.HTMLcell = htmlTableCell;

		this.HTMLcell.addEventListener("click", () => selectedListener(this));
		this.HTMLcell.classList.add("tile");
		this.HTMLcell.classList.add(color);
		this.HTMLcell.title = toChessNotation(row, col);

		this.takenListener = takenListener;

		this.set(null);
	}

	reset() {
		this.unmark();
		this.unselect();
		this.set(null);
	}

	set(value) {
		this.HTMLcell.innerHTML = value ?? "";
		this.value = value;
	}

	get() {
		return this.value;
	}

	isEmpty() {
		return this.value === null;
	}

	mark() {
		this.HTMLcell.classList.add("marked");
		if (!this.isEmpty()) this.HTMLcell.classList.add("enemy-marked");
	}

	unmark() {
		this.HTMLcell.classList.remove("marked", "enemy-marked");
	}

	select() {
		this.HTMLcell.classList.add("selected");
	}

	unselect() {
		this.HTMLcell.classList.remove("selected");
	}
}

class Board {
	constructor(width, height, htmlTable, playerMove) {
		this.width = width;
		this.height = height;

		this.selected = null;
		this.marked = [];

		this.boardArray = Array(this.height);

		this.boardTable = htmlTable;

		this.pieces = [];

		const listener = (square) =>  {
			console.log(square)
			playerMove(square, this);
		}

		for (let row = 0; row < this.height; row++) {
			this.boardArray[row] = Array(width);
			const tableRow = this.boardTable.insertRow();
			for (let col = 0; col < this.width; col++) {
				const square = new Square(
					this.height - row - 1, col,
					(col + row) % 2 === 0 ? SquareColors.LIGHT : SquareColors.DARK,
					tableRow.insertCell(),
					listener, () => {}
				);
				this.boardArray[row][col] = square;
			}
		}
	}

	setSelected(selectedSquare) {
		if (this.selected) {
			this.selected.unselect();
			this.marked.forEach((square) => square.unmark());
		}

		this.selected = selectedSquare;

		if (this.selected) {
			this.selected.select();

			this.marked = this.selected.get().getPossibleMoves();
			this.marked.forEach((square) => square.mark());
		} else {
			this.marked = [];
		}
	}

	reset() {
		this.forEach((square) => square.reset());
	}

	generatePieceMoves() {
		this.forEach((square) => { if (!square.isEmpty()) square.get().generatePossibleMoves(this, square) })
	}

	isInBoard(row, col) {
		return row > -1 && row < this.width && col > -1 && col < this.height;
	}

	get(row, col) {
		if (!this.isInBoard(row, col)) throw `Tried to get location (${row}, ${col}) not in board.`
		return this.boardArray[this.height - row - 1][col];
	}
	
	move(oldSquare, newSquare) {
		if (oldSquare.isEmpty()) throw "tried to move form empty square";

		newSquare.set(oldSquare.get());
		newSquare.get().timesMoved++;
		oldSquare.set(null)
		board.generatePieceMoves();
	}

	add(row, col, piece) {
		this.pieces.push(this.pieces);
		this.get(row, col).set(piece);
		this.generatePieceMoves();
	}

	forEach(func) {
		for (let row = 0; row < this.width; row++) {
			for (let col = 0; col < this.height; col++) {
				func(this.get(row, col));
			}
		}
	}
}

class Move {
	constructor(rowChange, colChange, canRepeat = false, condition = (board, piece, square) => true) {
		this.rowChange = rowChange;
		this.colChange = colChange;

		this.canRepeat = canRepeat;

		this.condition = condition;
	}

	generateMoves(board, piece, fromSquare) {
		const moves = [];
		let curRow = fromSquare.row + this.rowChange;
		let curCol = fromSquare.col + this.colChange;

		let going = true;

		while (
			going &&
			board.isInBoard(curRow, curCol) &&
			(board.get(curRow, curCol).isEmpty() || board.get(curRow, curCol).get().color !== piece.color) &&
			this.condition(board, piece, board.get(curRow, curCol))
		) {
			moves.push(board.get(curRow, curCol));

			going = this.canRepeat && board.get(curRow, curCol).isEmpty();

			curRow += this.rowChange;
			curCol += this.colChange;
		}

		return moves;
	}

	getReverseMove() {
		return new Move(-this.rowChange, this.colChange, this.canRepeat, this.condition);
	}
}

function toChessNotation(row, col) {
	return `${String.fromCharCode("a".charCodeAt(0) + col)}${row + 1}`;
}

function toCapitalized(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

class Piece {
	constructor(type, shortHandName, points, directional, moves, color) {
		this.type = type;
		this.shortHandName = shortHandName;
		this.points = points;
		this.color = color;

		this.svg = document.createElement("img");
		this.svg.src = `pieces/${this.color}/${this.type}.svg`;
		this.svg.alt = `${toCapitalized(color)} ${this.type}`;
		this.svg.style.width = "100%";
		this.svg.style.height = "100%";

		this.timesMoved = 0;

		this.currentMoves = [];

		if (directional && this.color !== neerSideColor) moves = moves.map((m) => m.getReverseMove());

		this.moves = moves;
	}

	getPossibleMoves() {
		return this.currentMoves;
	}
	
	generatePossibleMoves(board, curSquare) {
		this.currentMoves = this.moves.flatMap((move) => move.generateMoves(board, this, curSquare));	
	}
	
	toString() {
		return this.svg.outerHTML;
	}
}

function createpieceSubclass(type, shortHandName, points, moves, directional = false) {
	return class extends Piece {
		constructor(color) {
			super(type, shortHandName, points, directional, moves, color);
		}
	};
}

function makeMoveVariations(rowChange, colChange, canRepeat = false, condition = (board, piece, square) => true) {
	return [
		new Move(rowChange, colChange, canRepeat, condition),
		new Move(-rowChange, colChange, canRepeat, condition),
		new Move(rowChange, -colChange, canRepeat, condition),
		new Move(-rowChange, -colChange, canRepeat, condition),
	];
}

const King = createpieceSubclass("king", "K", Infinity, [
	...makeMoveVariations(1, 1, false),
	...makeMoveVariations(0, 1, false),
	...makeMoveVariations(1, 0, false),
	// TODO add castling
]);

const Pawn = createpieceSubclass("pawn", "", 1, [
	new Move(1, 0, false, (board, piece, square) => square.isEmpty()),
	new Move(2, 0, false, (board, piece, square) => piece.timesMoved === 0 && square.isEmpty()),
	new Move(1, 1, false, (board, piece, square) => !square.isEmpty() && square.color !== piece.color),
	new Move(1, -1, false, (board, piece, square) => !square.isEmpty() && square.color !== piece.color),
	// Todo add enpassant. I don't even want to think about promotion yet
], true);

const Knight = createpieceSubclass("knight", "N", 3, [...makeMoveVariations(1, 2), ...makeMoveVariations(2, 1)]);

const Bishop = createpieceSubclass("bishop", "B", 3, [...makeMoveVariations(1, 1, true)]);

const Rook = createpieceSubclass("rook", "R", 5, [...makeMoveVariations(0, 1, true), ...makeMoveVariations(1, 0, true)]);

const Queen = createpieceSubclass("queen", "Q", 9, [
	...makeMoveVariations(1, 1, true),
	...makeMoveVariations(0, 1, true),
	...makeMoveVariations(1, 0, true),
]);

const whoToMoveMessage = document.querySelector(".who-to-move");

let currentColor = startingColor;

function switchCurrentPlayer() {
	currentColor = PlayerColors.WHITE == currentColor ? PlayerColors.BLACK : PlayerColors.WHITE;
	whoToMoveMessage.innerText = toCapitalized(currentColor) + " to move";
}

const playerTrun = (square, board) => {
	if (!square.isEmpty() && currentColor === square.get().color) {
		board.setSelected(square);
	} else if (board.selected != null) {
		if (board.selected.get().getPossibleMoves().includes(square)) {
			board.move(board.selected, square);
			switchCurrentPlayer();
		}
		board.setSelected(null);
	}
}

const board = new Board(boardWidth, boardHeight, document.querySelector("table.board"), playerTrun);

// Place the black pieces

const piecesLayout = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook];
const pieces = new Map();

piecesLayout.forEach((type, i) => pieces.set([0, i], new type(PlayerColors.WHITE)));
piecesLayout.forEach((type, i) => pieces.set([1, i], new Pawn(PlayerColors.WHITE)));
piecesLayout.forEach((type, i) => pieces.set([7, i], new type(PlayerColors.BLACK)));
piecesLayout.forEach((type, i) => pieces.set([6, i], new Pawn(PlayerColors.BLACK)));

pieces.forEach((piece, location) => board.add(...location, piece))
