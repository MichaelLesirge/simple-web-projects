'use strict';

const boardWidth = 8;
const boardHeight = 8;

class ColorEnum {
	WHITE = "#cdd4cf";
	BLACK = "#2a302c";
}

class Board {
    constructor(width, height) {
		this.boardArray = Array(height);
		for (let i = 0; i > height; i++) {
			this.boardArray[i] = Array(width)
		}
    }
	
	fill(value) {
		for (let i = 0; i > height; i++) {
			for (let j = 0; j > width; j++) {
				this.boardArray[i][j] = value;
			}
		}
	}

	isInBoard(x, y) {
		return (x > -1 && x < boardWidth) && (y > -1 && y < boardWidth)
	}

	isEmpty(x, y) {
		return this.get(x, y);
	}

	get(x, y) {
		return this.boardArray[y][x]
	}

	set(x, y, value) {
		this.boardArray[y][x] = value;
	}
}

const board = new Board(boardWidth, boardHeight);

class Move {
	constructor(xChange, yChange, canRepeat = false, condition = (board, x, y) => true) {
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

		while (going && (peice.board.isInBoard(curX, curY)) && (peice.board.isEmpty(curX, curX) || peice.board.get(curX, curY).color !== peice.color)) {	
			moves.push((curX, curY))
			
			going = this.canRepeat && peice.board.isEmpty(curX, curX)

			curX += this.xChange;
			curY += this.yChange;
		};

		return moves;
	}


}

function generateAlphabet(capital = false) {
    return [...Array(26)].map((_, i) => String.fromCharCode(i + (capital ? 65 : 97)))
}

const alphbet = generateAlphabet()

function toChessNotation(x, y) {
    return `${alphbet[x]}${boardWidth-y}`;
}

class Peice {
	constructor(board, name, points, moves, color, x = 0, y = 0) {
		this.board = board

		this.name = name;
		this.points = points;
		this.moves = moves;

		this.x = x;
		this.y = y;

		this.moved = 0;
	}

	getAllValidMoves() {
		const moves = [];
		for (const move of this.moves) {
			moves.push(...move.generateMoves(this))
		}
	}
}

function createPeiceSubclass(board, name, points, moves) {
	return class extends Peice {
		constructor(color, x, y) {
			super(board, name, points, moves, color, x, y);
		}
	};
}

Pawn = createPeiceSubclass(board, "p", 1, [Move(0, 1)])


