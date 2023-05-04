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
	DARK: "dark"
}

const whoToMoveMessage = document.querySelector(".who-to-move")

class Square {
	constructor(row, col, color, htmlTableCell, listener) {
		this.row = row;
		this.col = col;
		this.HTMLcell = htmlTableCell;

		this.HTMLcell.addEventListener("click", () => listener(this))
		this.HTMLcell.classList.add("tile");
		this.HTMLcell.classList.add(color);
		this.HTMLcell.title = toChessNotation(row, col);

		this.set(null);
	}

	reset() {
		this.unmark();
		this.unselect()
		this.set(null);
	}

	getTaken() {
		this.set(null)
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
		this.HTMLcell.classList.add("selected")
	}
	
	unselect() {
		this.HTMLcell.classList.remove("selected")
	}
}

class Board {
	constructor(width, height, htmlTable) {
		this.width = width;
		this.height = height;

		this.setSelected(null);
		this.currentColor = startingColor;

		this.boardArray = Array(this.height);

		this.boardTable = htmlTable;

		const listener = (square) => {
			if (!square.isEmpty() && this.currentColor === square.get().color) {
				this.setSelected(square);
			}
			else {
				if (this.marked.includes(square)) {
					this.move(this.selected, square)
					this.switchCurrentPlayer()
				}
				this.setSelected(null);
			}
			
			
		}
		
		for (let row = 0; row < this.height; row++) {
			this.boardArray[row] = Array(width);
			const tableRow = this.boardTable.insertRow();
			for (let col = 0; col < this.width; col++) {
				const square = new Square(col, this.height - row - 1, (col + row) % 2 === 0 ? "light" : "dark", tableRow.insertCell(), listener);
				this.boardArray[row][col] = square;
			}
		}
	}
	
	switchCurrentPlayer() {
		this.currentColor = PlayerColors.WHITE == this.currentColor ? PlayerColors.BLACK : PlayerColors.WHITE;
		whoToMoveMessage.innerText = toCapitalized(this.currentColor) + " to move"
	}
	
	setSelected(selectedSquare) {
		if (this.selected) {
			this.selected.unselect();
			this.marked.forEach(square => square.unmark());
		}

		this.selected = selectedSquare;
		
		if (this.selected) {
			this.selected.select();

			this.marked = this.selected.get().generatePossibleMoves(this, this.selected);
			this.marked.forEach(square => square.mark());
		}
		else {
			this.marked = [];
		}
	}

	reset() {
		this.forEach((square) => square.reset());
	}

	isInBoard(row, col) {
		return row > -1 && row < this.width && col > -1 && col < this.height;
	}

	get(row, col) {
		return this.boardArray[this.height - col - 1][row];
	}

	move(oldSquare, newSquare) {
		if (oldSquare.isEmpty()) throw "tried to move form empty square";

		newSquare.set(oldSquare.get());
		newSquare.get().timesMoved++;
		oldSquare.getTaken();
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

	generateMoves(board, peice, fromSquare) {
		const moves = [];
		let curRow = fromSquare.row + this.rowChange;
		let curCol = fromSquare.col + this.colChange;

		let going = true;

		while (
			going &&
			board.isInBoard(curRow, curCol) &&
			(board.get(curRow, curCol).isEmpty() || board.get(curRow, curCol).value.color !== peice.color) &&
			this.condition(board, peice, curRow, curCol)
		) {
			moves.push(board.get(curRow, curCol));

			going = this.canRepeat && board.get(curRow, curCol).isEmpty();

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
	return `${String.fromCharCode("a".charCodeAt(0) + row)}${col + 1}`;
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

		if (directional && this.color !== neerSideColor) moves = moves.map((m) => m.getReverseMove());

		this.moves = moves;
	}

	generatePossibleMoves(board, curSquare) {
		const moves = [];
		for (const move of this.moves) {
			moves.push(...move.generateMoves(board, this, curSquare));
		}
		return moves;
	}

	toString() {
		return this.svg.outerHTML;
	}
}

function createPeiceSubclass(type, shortHandName, points, moves, directional = false) {
	return class extends Piece {
		constructor(color) {
			super(type, shortHandName, points, directional, moves, color);
		}
	};
}

function makeMoveVariations(rowChange, colChange, canRepeat = false, condition = (board, peice, newRow, newCol) => true) {
	return [
		new Move(rowChange, colChange, canRepeat, condition),
		new Move(-rowChange, colChange, canRepeat, condition),
		new Move(rowChange, -colChange, canRepeat, condition),
		new Move(-rowChange, -colChange, canRepeat, condition),
	];
}

// todo make move group creator that simplfies his code
const King = createPeiceSubclass("king", "K", Infinity, [
	...makeMoveVariations(1, 1),
	...makeMoveVariations(0, 1),
	...makeMoveVariations(1, 0),
]);

const Pawn = createPeiceSubclass("pawn", "", 1, [
		new Move(0, 1, false, (board, peice, newRow, newCol) => board.get(newRow, newCol).isEmpty()),
		new Move(1, 1, false, (board, peice, newRow, newCol) => !board.get(newRow, newCol).isEmpty() && board.get(newRow, newCol).color !== peice.color),
		new Move(-1, 1, false, (board, peice, newRow, newCol) => !board.get(newRow, newCol).isEmpty() && board.get(newRow, newCol).color !== peice.color),
		new Move(0, 2, false, (board, peice, newRow, newCol) => peice.timesMoved === 0 && board.get(newRow, newCol).isEmpty()),
	], true
);

const Knight = createPeiceSubclass("knight", "N", 3, [...makeMoveVariations(1, 2), ...makeMoveVariations(2, 1)]);

const Bishop = createPeiceSubclass("bishop", "B", 3, [...makeMoveVariations(1, 1, true)]);

const Rook = createPeiceSubclass("rook", "R", 5, [...makeMoveVariations(0, 1, true), ...makeMoveVariations(1, 0, true)]);

const Queen = createPeiceSubclass("queen", "Q", 9, [
	...makeMoveVariations(1, 1, true),
	...makeMoveVariations(0, 1, true),
	...makeMoveVariations(1, 0, true),
]);

// Place the black pieces
board.get(0, 7).set(new Rook(PlayerColors.BLACK));
board.get(1, 7).set(new Knight(PlayerColors.BLACK));
board.get(2, 7).set(new Bishop(PlayerColors.BLACK));
board.get(3, 7).set(new Queen(PlayerColors.BLACK));
board.get(4, 7).set(new King(PlayerColors.BLACK));
board.get(5, 7).set(new Bishop(PlayerColors.BLACK));
board.get(6, 7).set(new Knight(PlayerColors.BLACK));
board.get(7, 7).set(new Rook(PlayerColors.BLACK));
for (let row = 0; row < 8; row++) {
    board.get(row, 6).set(new Pawn(PlayerColors.BLACK));
}

// Place the white pieces
board.get(0, 0).set(new Rook(PlayerColors.WHITE));
board.get(1, 0).set(new Knight(PlayerColors.WHITE));
board.get(2, 0).set(new Bishop(PlayerColors.WHITE));
board.get(3, 0).set(new Queen(PlayerColors.WHITE));
board.get(4, 0).set(new King(PlayerColors.WHITE));
board.get(5, 0).set(new Bishop(PlayerColors.WHITE));
board.get(6, 0).set(new Knight(PlayerColors.WHITE));
board.get(7, 0).set(new Rook(PlayerColors.WHITE));
for (let row = 0; row < 8; row++) {
    board.get(row, 1).set(new Pawn(PlayerColors.WHITE));
}
