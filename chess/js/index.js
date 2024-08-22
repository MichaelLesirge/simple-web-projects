"use strict";

const boardWidth = 8;
const boardHeight = 8;

const PlayerColors = {
	WHITE: "white",
	BLACK: "black",
};

const nearSideColor = PlayerColors.WHITE;
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

		this.kings = {}
		this.kings[PlayerColors.WHITE] = null;
		this.kings[PlayerColors.BLACK] = null;

		this.boardArray = Array(this.height);

		this.htmlTable = htmlTable;

		const listener = (square) => {
			console.log(square)
			playerMove(square, this);
		}

		for (let row = 0; row < this.height; row++) {
			this.boardArray[row] = Array(width);
			const tableRow = this.htmlTable.insertRow();
			for (let col = 0; col < this.width; col++) {
				const square = new Square(
					this.height - row - 1, col,
					(col + row) % 2 === 0 ? SquareColors.LIGHT : SquareColors.DARK,
					tableRow.insertCell(),
					listener, () => { }
				);
				this.boardArray[row][col] = square;
			}
		}

		this.undoData = [];

		this.isFlipped = false;
	}

	setSelected(selectedSquare) {
		if (this.selected) {
			this.selected.unselect();
			this.marked.forEach((square) => square.unmark());
		}

		this.selected = selectedSquare;

		if (this.selected) {
			this.selected.select();

			this.marked = this.selected.get().getPossibleMoves(this, selectedSquare);
			this.marked.forEach((square) => square.mark());
		} else {
			this.marked = [];
		}
	}

	reset() {
		this.kings[PlayerColors.WHITE] = null;
		this.kings[PlayerColors.BLACK] = null;
		this.forEach((square) => square.reset());
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

		this.undoData.push([oldSquare, newSquare.get(), newSquare]);

		const movedPiece = oldSquare.get()

		if (movedPiece?.type == "king") {
			this.kings[movedPiece.color] = newSquare;
		}

		movedPiece.timesMoved++;

		newSquare.set(movedPiece);
		oldSquare.set(null)
	}

	undoMove() {
		if (this.undoData.length == 0) return;

		const [oldSquare, newSquareData, newSquare] = this.undoData.pop();

		const movedPiece = newSquare.get();

		movedPiece.timesMoved--;
		oldSquare.set(movedPiece);
		newSquare.set(newSquareData);

		if (movedPiece?.type == "king") {
			this.kings[movedPiece.color] = oldSquare;
		}

	}

	add(row, col, piece) {
		const square = this.get(row, col)
		if (piece?.type == "king") {
			this.kings[piece.color] = square;
		}
		square.set(piece);
	}

	forEach(func) {
		for (let row = 0; row < this.width; row++) {
			for (let col = 0; col < this.height; col++) {
				func(this.get(row, col));
			}
		}
	}

	flip() {
		this.isFlipped = !this.isFlipped;
		const rows = Array.from(this.htmlTable.getElementsByTagName('tr'));
		rows.forEach(row => this.htmlTable.deleteRow(-1));
		rows.reverse().forEach(row => this.htmlTable.appendChild(row));
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

		if (directional && this.color !== nearSideColor) moves = moves.map((m) => m.getReverseMove());

		this.moves = moves;
	}

	getPossibleMovesUnsafe(board, curSquare) {
		return this.moves
			.flatMap((move) => move.generateMoves(board, this, curSquare))
	}

	getPossibleMoves(board, curSquare) {
		return this.getPossibleMovesUnsafe(board, curSquare)
			.filter((square) => this.isMoveSafe(board, square, curSquare));
	}

	isMoveSafe(board, targetSquare, curSquare) {
		let safe = true;
		board.move(curSquare, targetSquare);
		board.forEach((square) => {
			const piece = square.get();
			if (
				(piece != null) &&
				(piece.color != this.color && piece.getPossibleMovesUnsafe(board, square).includes(board.kings[this.color]))
			) {
				safe = false;
			}
		})
		board.undoMove()
		return safe;
	}

	toString() {
		return this.svg.outerHTML;
	}
}

function createPieceSubclass(type, shortHandName, points, moves, directional = false) {
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

const King = createPieceSubclass("king", "K", Infinity, [
	...makeMoveVariations(1, 1, false),
	...makeMoveVariations(0, 1, false),
	...makeMoveVariations(1, 0, false),
	// TODO add castling
]);

const Pawn = createPieceSubclass("pawn", "", 1, [
	new Move(1, 0, false, (board, piece, square) => square.isEmpty()),
	new Move(2, 0, false, (board, piece, square) => piece.timesMoved === 0 && square.isEmpty()),
	new Move(1, 1, false, (board, piece, square) => !square.isEmpty() && square.color !== piece.color),
	new Move(1, -1, false, (board, piece, square) => !square.isEmpty() && square.color !== piece.color),
	// Todo add en passant. I don't even want to think about promotion yet
], true);

const Knight = createPieceSubclass("knight", "N", 3, [...makeMoveVariations(1, 2), ...makeMoveVariations(2, 1)]);

const Bishop = createPieceSubclass("bishop", "B", 3, [...makeMoveVariations(1, 1, true)]);

const Rook = createPieceSubclass("rook", "R", 5, [...makeMoveVariations(0, 1, true), ...makeMoveVariations(1, 0, true)]);

const Queen = createPieceSubclass("queen", "Q", 9, [
	...makeMoveVariations(1, 1, true),
	...makeMoveVariations(0, 1, true),
	...makeMoveVariations(1, 0, true),
]);

const whoToMoveMessage = document.getElementById("who-to-move");
const shouldFlipBoard = document.getElementById("flip")
shouldFlipBoard.addEventListener("click", ensureCorrectNearPlayer)

let currentColor = startingColor;

const resetButton = document.getElementById("reset");
resetButton.addEventListener("click", () => { board.reset(); placeStartingPieces();  ensureCorrectNearPlayer(); })

const undoButton = document.getElementById("undo");
undoButton.addEventListener("click", () => { board.undoMove(); this.switchCurrentPlayer(); })


function ensureCorrectNearPlayer() {
	if (
		(
			shouldFlipBoard.checked &&
			(currentColor == nearSideColor && board.isFlipped) ||
			(currentColor != nearSideColor && !board.isFlipped)
		) || (
			!shouldFlipBoard.checked &&
			board.isFlipped
		)
	) {
		board.flip();
	}
}

function switchCurrentPlayer() {
	currentColor = PlayerColors.WHITE == currentColor ? PlayerColors.BLACK : PlayerColors.WHITE;
	whoToMoveMessage.innerText = toCapitalized(currentColor) + " to move";
	if (shouldFlipBoard.checked) {
		board.htmlTable.classList.remove("fade-in");
		board.htmlTable.classList.add("fade-out");
		setTimeout(() => {
			board.flip();
			board.htmlTable.classList.remove("fade-out");
			board.htmlTable.classList.add("fade-in");
		}, 1000 * 0.25)
	}

	let hasNoMoves = true;
	let isInCheck = false;
	board.forEach((square) => {
		const piece = square.get();
		if (piece != null) {
			if (piece.color == currentColor) {
				if (hasNoMoves && piece.getPossibleMoves(board, square).length > 0) {
					hasNoMoves = false;
				}
			}
			else {
				if (piece.getPossibleMoves(board, square).includes(board.kings[currentColor])) {
					isInCheck = true;
				}
			}
		}
	})

	console.log(hasNoMoves, isInCheck);
	

	if (hasNoMoves && !isInCheck) {
		whoToMoveMessage.innerText = `Game Over. It's a tie!`
	}
	else if (hasNoMoves && isInCheck) {
		whoToMoveMessage.innerText = `Game Over. ${toCapitalized(PlayerColors.WHITE == currentColor ? PlayerColors.BLACK : PlayerColors.WHITE)} has won!`
	}
}

const playerTurn = (square, board) => {

	if (!square.isEmpty() && currentColor === square.get().color) {
		board.setSelected(square);
	} else if (board.selected != null) {
		if (board.selected.get().getPossibleMoves(board, board.selected).includes(square)) {
			board.move(board.selected, square);
			switchCurrentPlayer();
		}
		board.setSelected(null);
	}
}

const board = new Board(boardWidth, boardHeight, document.querySelector("table.board"), playerTurn);

function placeStartingPieces() {

	currentColor = startingColor;

	const piecesLayout = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook];
	const pieces = new Map();

	piecesLayout.forEach((type, i) => pieces.set([0, i], new type(PlayerColors.WHITE)));
	piecesLayout.forEach((type, i) => pieces.set([1, i], new Pawn(PlayerColors.WHITE)));
	piecesLayout.forEach((type, i) => pieces.set([7, i], new type(PlayerColors.BLACK)));
	piecesLayout.forEach((type, i) => pieces.set([6, i], new Pawn(PlayerColors.BLACK)));

	board.reset()
	pieces.forEach((piece, location) => board.add(...location, piece))
}

placeStartingPieces()