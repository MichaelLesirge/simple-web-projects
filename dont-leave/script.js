const body = document.getElementById("body");

const face = document.getElementById("face");
const text = document.getElementById("text");

const faces = {
	happy: "\\(ᵔᵕᵔ)/",
	sad: "(ᵕ-ᵕ)",
    evil: "(•`_´•)و",
};

function clearTextIn(time = 2000) {
	setTimeout(() => (text.innerText = ""), time);
}

let times_left = 0;

const messages = ["Hi!", "Don't leave me, I like you here!", "Your scaring me, but I thought you were going to leave!", "Stop doing that, it's scary.", "stop scaring me like that.", "Don't pretend to leave me ever again!", "I'm serious, stop!", "I'm getting angry here, stop that!", "Don't you dare do that again!", "this is your last warning... Stop leaving now."];

document.addEventListener("mouseleave", () => {
	if (text.innerText === messages[0]) clearTextIn(0);
    if (times_left < messages.length) {face.innerText = faces.sad}
	times_left++;
});

document.addEventListener("mouseenter", () => {
	if (times_left == messages.length) {
		fetch("https://api.ipify.org?format=json")
			.then((response) => response.json())
			.then((data) => {
				fetch(`https://api.ipregistry.co/${data.ip}?key=ups3qbswcwz89lxj`)
					.then((response) => response.json())
					.then((data) => {
						face.innerText = faces.evil;
                        const textarea = document.createElement("textarea");
                        face.appendChild(textarea);

                        delete data.currency;
                        textarea.rows = 16;
                        textarea.cols = 60;
                        const ip_info = JSON.stringify(data, undefined, 2).split("\n");
                        let i = 0;
                        const interval = setInterval(() => {
                            if (i < ip_info.length) {
                                textarea.value += ip_info[i] + "\n";
                                textarea.scrollTop = textarea.scrollHeight;
                            }
                            else {
                                textarea.scrollTop = textarea.scrollTop;
                                clearInterval(interval)
                            }
                            i++;
                        }, 500)
					});
			});
	} else if (times_left < messages.length) {
		face.innerText = faces.happy;
        text.innerText = messages[times_left]
        clearTextIn(900)
	}
});

clearTextIn(1000);
