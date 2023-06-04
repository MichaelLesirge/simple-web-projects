const allPages = Array(...document.querySelectorAll(".page"));
const daysLeft = Number(document.querySelector('a[href="/washington/#taking-the-course"]').innerText.split(" ")[1]);
const totalPages = allPages.length
const completedPages = allPages.filter((e) => e.classList.contains("complete")).length;
const pagesLeft = totalPages - completedPages
const limit = 3;
let daysToDo = 0;
while (((pagesLeft-daysToDo) / daysLeft > limit)) {daysToDo++}
console.log(`${completedPages} of ${totalPages} complete, ${pagesLeft} to go. ${((completedPages / totalPages) * 100).toFixed(2)}% done.`);
console.log(`Currently have ${daysLeft} days (${Math.floor(daysLeft / 7)}${daysLeft % 7 === 0 ? "" : "+"} weeks) to complete this cource on time.`)
console.log(`Must complete ${(pagesLeft / daysLeft).toFixed(2)} pages every single day to complete on time. ${daysToDo == 0 ? "" : `Should have no more than ${limit} a day to do at any time. Must do ${daysToDo} to get caught up`}`);
console.log("Don't be a lazy bum, do 2 unit each weekend and you will be fine");

`${completedPages}/${totalPages}`;