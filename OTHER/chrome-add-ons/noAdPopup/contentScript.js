"use strict";

setInterval(() => {
	const popupTexts = document.querySelectorAll("#title > yt-attributed-string > span > span");
	popupTexts.forEach((element) => {
		if (element.innerText === "Ad blockers are not allowed on YouTube") {
			const popUp = element.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;
			console.log(popUp.parentNode.removeChild(popUp));
		}
	});
}, 1000);
