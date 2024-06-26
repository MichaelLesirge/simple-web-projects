import { charRange, randomChoice, randomFloat, randomInt } from "./util.js";
import makeFollowMouse from "./mouseFollower.js";
import makeHackerText from "./hackerEffect.js";

import spiral from "./spiral.js";
import conway from "./conway.js";
import tetris from "./tetris.js";
import matrix from "./matrix.js";
import particle from "./particle.js";

makeFollowMouse(document.getElementById("blob"));

makeHackerText(
    document.querySelectorAll(".hacker-text"),
    charRange("a", "z") + charRange("A", "Z") + charRange("0", "9") + "`-=[]\\;',./~_+{}|:\"<>?".repeat(2),
    {timeout: 100, addBlanksAfter: 400}
)

spiral()
conway()
tetris();
matrix();
particle();