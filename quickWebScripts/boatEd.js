f = (s) => {
	console.log(s);
	("setTimeout(()=>alert(s),10)");
};
x = Array(...document.querySelectorAll(".page"));
c = x.filter((e) => e.classList.contains("complete")).length;
f(`${c} of ${x.length} complete, ${x.length - c} to go. ${((c / x.length) * 10).toFixed(2)}% done.`);
d = Number(document.querySelector('a[href="/washington/#taking-the-course"]').innerText.split(" ")[1]);
f(`Must complete ${((x.length - c) / d).toFixed(2)} pages every day to complete on time`);
`${c}/${x.length}`;
