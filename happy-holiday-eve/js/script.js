"use strict";

const today = new Date();
const oneDay = 24 * 60 * 60 * 1000;

const holidays = {
	ny: {
		name: "New Years",
		merryMessage: "Happy",
		startDate: new Date(today.getFullYear() + (today.getMonth() != 0 || today.getDay() != 1), 0, 1),
	},
	xmas: {
		name: "Christmas",
		merryMessage: "Merry",
		startDate: new Date(today.getFullYear(), 11, 25),
	},
	// Waiting for hebrew calendar implantation in javascript
	// TODO maybe add end date and say "Happy first/second/third... day of " 
	han: {
	    name: "Hanukkah",
	    merryMessage: "Happy",
	    startDate: today,
	},
	kz: {
		name: "Kwanzaa",
		merryMessage: "Happy",
		startDate: new Date(today.getFullYear(), 11, 26),
	},
};

const holidaySpan = document.querySelector("#holiday-name");
const eveMessageSpan = document.querySelector("#eve-message");
const merryMessageSpan = document.querySelector("#merry-message");

function setHoliday(holiday) {
	holidaySpan.innerText = holiday.name;
	merryMessageSpan.innerText = holiday.merryMessage;

	const daysTillHoliday = getDaysTill(holiday.startDate);

	eveMessageSpan.innerText = "Eve ".repeat(daysTillHoliday);
	eveMessageSpan.title = `Eve × ${daysTillHoliday}`;

	console.log(daysTillHoliday);
}

function getDaysTill(date) {
	return Math.round((date - today) / oneDay);
}

setHoliday(holidays.ny);

const selectHolidayInput = document.querySelector("#holidays-select");

// add each holiday to menu
for (const [name, holiday] of Object.entries(holidays)) {
	const option = document.createElement("option");
	option.value = name;
	option.innerText = holiday.name;
	selectHolidayInput.add(option);
}

selectHolidayInput.onchange = (event) => {
	setHoliday(holidays[event.target.value]);
	if (event.target.value == "han") setTimeout(() => alert("Unknown start date because I don't know how Hebrew calendar works or how to code that. Sorry!"), 100);
};

// TODO add differnt condions if message overflows
// window.scrollTo({ right: 0, behavior: 'auto' });
// window.scrollTo({ left: 0, behavior: 'smooth' });
