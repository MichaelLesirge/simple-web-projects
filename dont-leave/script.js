const body = document.getElementById("body");

const face = document.getElementById("face");
const text = document.getElementById("text");

const faces = {
	happy: "\\(ᵔᵕᵔ)/",
	sad: "(ᵕ-ᵕ)",
    evil: "(•`_´•)و",
};

let count = 0;
let done = false;

const messages = ["Please don't leave!", "Come back! Don't go.", "Stop it, come back here.", "Don't you dare leave me.", "No! Stop scaring me and pretending to leave.", "Don't you dare try to leave again.", "This is you last warning. Do not leave."];

document.addEventListener("mouseleave", () => {
    if (done) return;

    if (count == messages.length) {
        done = true;
        // dog shit code:
        face.innerText = faces.evil;
        fetch("https://api.ipify.org?format=json")
            .then((response) => response.json())
            .then((data) => {
                fetch(`https://api.ipregistry.co/${data.ip}?key=ups3qbswcwz89lxj`)
                    .then((response) => response.json())
                    .then((data) => {
                        face.innerText = faces.evil;
                        const textarea = document.createElement("textarea");
                        face.appendChild(textarea);

                        console.log(data)
    
                        delete data.currency;
                        delete data.location.country.flag;
                        delete data.location.country.languages;
                        delete data.security;
                        delete data.time_zone;
                        delete data.location.country.borders;
                        delete data.location.country.population;
                        delete data.location.country.population_density;
                        textarea.rows = 16;
                        textarea.cols = 60;
                        const ipInfo = JSON.stringify(data, undefined, 2).split("\n");
                        let i = 0;

                        document.title = faces.evil;

                        document.body.style.cursor = "not-allowed;";
                        const interval = setInterval(() => {
                            if (i < ipInfo.length) {
                                textarea.value += ipInfo[i] + "\n";
                                textarea.scrollTop = textarea.scrollHeight;
                            }
                            else {
                                textarea.scrollTop = textarea.scrollTop;
                                console.log(`https://earth.google.com/web/@${data.location.latitude},${data.location.longitude},150000a`)
                                window.open(`https://earth.google.com/web/@${data.location.latitude},${data.location.longitude},150000a`);
                                clearInterval(interval)
                            }
                            i++;
                        }, 100)
                    });
            });

    } else if (count < messages.length) {
        face.innerText = faces.sad;
        text.innerText = messages[count]
    }
    count++;
});

document.addEventListener("mouseenter", () => {
    if (done) return;
    face.innerText = faces.happy;
    text.innerText = "";
})
