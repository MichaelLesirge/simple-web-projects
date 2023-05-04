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

let debug = false;

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
		if (!this.isInBoard(row, col)) throw "Tried to get location not in board"
		return this.boardArray[this.height - row - 1][col];
	}
	
	move(oldSquare, newSquare) {
		if (oldSquare.isEmpty()) throw "tried to move form empty square";

		newSquare.set(oldSquare.get());
		newSquare.get().timesMoved++;
		oldSquare.set(null);
		board.generatePieceMoves();
	}

	add(piece, row, col) {
		this.pieces.push(this.pieces);
		this.get(row,col).set(piece);
		board.generatePieceMoves();
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
	constructor(rowChange, colChange, canRepeat = false, condition = (board, piece, row, col) => true) {
		this.rowChange = rowChange;
		this.colChange = colChange;

		this.canRepeat = canRepeat;

		this.condition = condition;
	}

	generateMoves(board, piece, fromSquare, debug) {
		debug = debug && this.rowChange === 0 && this.colChange === 1;
		const moves = [];
		if (debug) console.log([fromSquare.row, this.rowChange], [fromSquare.col, this.colChange])
		let curRow = fromSquare.row + this.rowChange;
		let curCol = fromSquare.col + this.colChange;
		if (debug) console.log([curRow], [curCol])

		let going = true;

		while (
			going &&
			board.isInBoard(curRow, curCol) &&
			(board.get(curRow, curCol).isEmpty() || board.get(curRow, curCol).value.color !== piece.color) &&
			this.condition(board, piece, curRow, curCol)
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
		// if (this.type === "knight" && this.color === PlayerColors.WHITE) { console.trace() }
		return this.currentMoves;
	}
	
	generatePossibleMoves(board, curSquare) {
		const moves = [];
		for (const move of this.moves) {	
			moves.push(...move.generateMoves(board, this, curSquare, debug && (this.type === "pawn" && this.color == PlayerColors.WHITE && curSquare.col === 7)));
		}
		this.currentMoves = moves;
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

function makeMoveVariations(rowChange, colChange, canRepeat = false, condition = (board, piece, newRow, newCol) => true) {
	return [
		new Move(rowChange, colChange, canRepeat, condition),
		new Move(-rowChange, colChange, canRepeat, condition),
		new Move(rowChange, -colChange, canRepeat, condition),
		new Move(-rowChange, -colChange, canRepeat, condition),
	];
}

// todo make move group creator that simplfies his code
const King = createpieceSubclass("king", "K", Infinity, [
	...makeMoveVariations(1, 1, false),
	...makeMoveVariations(0, 1, false),
	...makeMoveVariations(1, 0, false),
]);

const Pawn = createpieceSubclass("pawn", "", 1, [
	new Move(1, 0, false, (board, piece, newRow, newCol) => board.get(newRow, newCol).isEmpty()),
	new Move(2, 0, false, (board, piece, newRow, newCol) => piece.timesMoved === 0 && board.get(newRow, newCol).isEmpty()),
	new Move(1, 1, false,(board, piece, newRow, newCol) => !board.get(newRow, newCol).isEmpty() && board.get(newRow, newCol).color !== piece.color),
	new Move(1, -1, false, (board, piece, newRow, newCol) => !board.get(newRow, newCol).isEmpty() && board.get(newRow, newCol).color !== piece.color),
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
board.add(new Rook(PlayerColors.BLACK), 7, 0);
board.add(new Knight(PlayerColors.BLACK), 7, 1);
board.add(new Bishop(PlayerColors.BLACK), 7, 2);
board.add(new Queen(PlayerColors.BLACK), 7, 3);
board.add(new King(PlayerColors.BLACK), 7, 4);
board.add(new Bishop(PlayerColors.BLACK), 7, 5);
board.add(new Knight(PlayerColors.BLACK), 7, 6);
board.add(new Rook(PlayerColors.BLACK), 7, 7);
for (let col = 0; col < 8; col++) {
	board.add(new Pawn(PlayerColors.BLACK), 6, col);
}

// Place the white pieces
board.add(new Rook(PlayerColors.WHITE), 0, 0);
board.add(new Knight(PlayerColors.WHITE), 0, 1);
board.add(new Bishop(PlayerColors.WHITE), 0, 2);
board.add(new Queen(PlayerColors.WHITE), 0, 3);
board.add(new King(PlayerColors.WHITE), 0, 4);
board.add(new Bishop(PlayerColors.WHITE), 0, 5);
board.add(new Knight(PlayerColors.WHITE), 0, 6);
board.add(new Rook(PlayerColors.WHITE), 0, 7);
for (let col = 0; col < 8; col++) {
	board.add(new Pawn(PlayerColors.WHITE), 1, col);
}

debug = true;