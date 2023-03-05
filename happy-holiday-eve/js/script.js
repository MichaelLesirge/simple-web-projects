"use strict";

let today = new Date();
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

function getTimeTo(date) {
	let delta = Math.abs(date - today) / 1000;

	const days = Math.floor(delta / 86400);
	delta -= days * 86400;

	const hours = Math.floor(delta / 3600) % 24;
	delta -= hours * 3600;

	const minutes = Math.floor(delta / 60) % 60;
	delta -= minutes * 60;

	const seconds = Math.floor(delta);

	return [days, hours, minutes, seconds];
}

const holidayElement = document.querySelector("#holiday-name");
const eveMessageElement = document.querySelector("#eve-message");
const merryMessageElement = document.querySelector("#merry-message");
const selectHolidayInput = document.querySelector("#holidays-select");
const countDownClockElement = document.querySelector("#count-down-clock");

let holiday = holidays.ny;

// add each holiday to menu
for (const [name, holiday] of Object.entries(holidays)) {
	const option = document.createElement("option");
	option.value = name;
	option.innerText = holiday.name;
	selectHolidayInput.add(option);
}

selectHolidayInput.onchange = (event) => {

	if (event.target.value == "han") {
		alert("Unknown start date because I don't know how Hebrew calendar works or how to code that. Sorry!");
		return
	}

	holiday = holidays[event.target.value];

	holidayElement.innerText = holiday.name;
	merryMessageElement.innerText = holiday.merryMessage;

};

setInterval(() => {
	today = new Date()

	const [days, hours, minutes, seconds] = getTimeTo(holiday.startDate);

	eveMessageElement.innerText = "Eve ".repeat(days);
	eveMessageElement.title = `Eve × ${days}`;

	countDownClockElement.innerText = [
		makeClockFormat(days),
		makeClockFormat(hours),
		makeClockFormat(minutes),
		makeClockFormat(seconds),
	].join(":");
	
	countDownClockElement.title = [	
		makeClockTitleFormat(days, "day"),
		makeClockTitleFormat(hours, "hour"),
		makeClockTitleFormat(minutes, "minute"),
		makeClockTitleFormat(seconds, "second"),
	].join(", ");
});

function makeClockFormat(time_unit_amount, padding=2) {
	return String(time_unit_amount).padStart(padding, "0");
}

function makeClockTitleFormat(time_unit_amount, time_name) {
	return `${time_unit_amount} ${time_name}${time_unit_amount >= 2 ? "s" : ""}`
}

// TODO add differnt condions if message overflows
// window.scrollTo({ right: 0, behavior: 'auto' });
// window.scrollTo({ left: 0, behavior: 'smooth' });
