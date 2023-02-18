'use strict';

const boardWidth = 8;
const boardHeight = 8;


class Board {
    constructor() {
        
    }
}

class Move {
	constructor(xChange, yChange, repeat = false, jump = false, condition = (board) => true) {
		this.x = xChange;
		this.y = yChange;
	}
}

function generateAlphabet(capital = false) {
    return [...Array(26)].map((_, i) => String.fromCharCode(i + (capital ? 65 : 97)))
}

const alphbet = generateAlphabet()

function toChessNotation(x, y) {
    return `${alphbet[x]}${y+1}`;
}

class Peice {
	constructor(name, moves) {
		this.name = name;
		this.moves = moves;
	}
}

function createPeiceSubclass(name, moves) {
	return class extends Peice {
		constructor(x, y) {
			self.x = x;
			self.y = y;
			super(name, moves);
		}
	};
}

Pawn = createPeiceSubclass("", []);


