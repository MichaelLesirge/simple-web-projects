import { charRange } from "./util.js";
import makeFollowMouse from "./mouseFollower.js";
import makeHackerText from "./hackerEffect.js";
import { setHashAutoFocus } from "./canvasUtil.js";

import spiral from "./spiral.js";
import conway from "./conway.js";
import tetris from "./tetris.js";
import matrix from "./matrix.js";
import particle from "./particle.js";
import mondrian from "./mondrian.js";
import balls from "./balls.js";
// import lightSpeed from "./lightSpeed.js";

makeFollowMouse(document.getElementById("blob"));

document.querySelectorAll(".title-section").forEach(element => {
    setHashAutoFocus(element, "", {offScreenRatio: 0.5})
});

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
mondrian();
balls();
// lightSpeed();