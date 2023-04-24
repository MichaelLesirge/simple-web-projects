const allPages = Array(...document.querySelectorAll(".page"));

const daysLeft = Number(document.querySelector('a[href="/washington/#taking-the-course"]').innerText.split(" ")[1]);

const totalPages = allPages.length
const completedPages = allPages.filter((e) => e.classList.contains("complete")).length;
const pagesLeft = totalPages - completedPages

console.log(`${completedPages} of ${totalPages} complete, ${pagesLeft} to go. ${((completedPages / totalPages) * 100).toFixed(2)}% done.`);
console.log(`Currently have ${daysLeft} days (${Math.floor(daysLeft / 7)}${daysLeft % 7 === 0 ? "" : "+"} weeks) to complete this cource.`)
console.log(`Must complete ${(pagesLeft / daysLeft).toFixed(2)} pages every day to complete on time`);

`${completedPages}/${totalPages}`;
