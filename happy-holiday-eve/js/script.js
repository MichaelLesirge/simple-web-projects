"use strict";

let now = new Date();
const oneDay = 24 * 60 * 60 * 1000;

const selectHolidayInput = document.querySelector("#holidays-select");
const messageElement = document.querySelector("#message");
const countDownClockElement = document.querySelector("#count-down-clock");

const holidays = {
	ny: {
		message: "Happy New Years",
		startDate: new Date(now.getFullYear(), 0, 1),
	},
	xmas: {
		message: "Merry Christmas",
		startDate: new Date(now.getFullYear(), 11, 25),
	},
	han: {
		message: "Happy Hanukkah",
		startDate: now,
	},
	kz: {
		message: "Happy Kwanzaa",
		startDate: new Date(now.getFullYear(), 11, 26),
	},
};

let customCount = 0;

const customs = JSON.parse(localStorage.getItem("customs")) ?? [];
for (const [message, date] of customs) {
	addCustomOption(message, parceDate(date), holidays);
}

// add each holiday to menu
for (const [key, holiday] of Object.entries(holidays)) {
	addOption(key, holiday.message);
}

addOption(
	"custom",
	centerText(" custom ", Object.values(holidays).reduce((sum, val) => Math.max(sum, val.message.length), 0),"-")
);

function addOption(key, message) {
	const option = document.createElement("option");
	option.value = key;
	option.innerText = message;
	selectHolidayInput.add(option);
}

let holidayKey = localStorage.getItem("current") ?? Object.entries(holidays)[0][0];
selectHolidayInput.value = holidayKey;

selectHolidayInput.onchange = (event) => {
	if (event.target.value == "han") {
		setTimeout(() => {
			alert("Unknown start date because I don't know how Hebrew calendar works or how to code that. Sorry!");
			selectHolidayInput.value = holidayKey;
		}, 200);
		return;
	} else if (event.target.value == "custom") {
		let message = prompt("Enter message: ");
		let date = parceDate(prompt("Enter date (mm/dd): "));
		
		while (date === null) {
			date = parceDate(prompt("Invalid date. Enter correct date (mm/dd): "));
		}

		const key = addCustomOption(message, date, holidays);
		saveCustomOption(message, date)

		addOption(key, holidays[key].message)

		selectHolidayInput.value = key;

	}

	holidayKey = event.target.value;
	localStorage.setItem("current", holidayKey);
};

let last;
setInterval(() => {
	now = new Date();

	const holiday = holidays[holidayKey];

	while (isInPast(holiday.startDate, now)) {
		holiday.startDate.setFullYear(holiday.startDate.getFullYear() + 1);
	}

	const [days, hours, minutes, seconds] = isToday(holiday.startDate, now) ? [0, 0, 0, 0] : getTimeTo(holiday.startDate, now);

	const daysRoundedUp = days + Boolean(hours || minutes || seconds);

	if (last !== daysRoundedUp) {
		message.innerText = `${holiday.message} ${"Eve ".repeat(daysRoundedUp)}!`;
		message.title = `${holiday.message} Eve × ${daysRoundedUp}`;
	}

	countDownClockElement.innerText = [
		makeClockFormat(days),
		makeClockFormat(hours),
		makeClockFormat(minutes),
		makeClockFormat(seconds),
	].join(":");

	countDownClockElement.title = `${makeClockTitleFormat(days, "day")}, ${makeClockTitleFormat(hours, "hour")}, ${makeClockTitleFormat(minutes, "minute")}, and ${makeClockTitleFormat(seconds, "second")} to ${holiday.startDate.toString().split("00:00:00")[0]}`;

	last = daysRoundedUp;
});

function makeClockFormat(time_unit_amount, padding = 2) {
	return String(time_unit_amount).padStart(padding, "0");
}

function makeClockTitleFormat(time_unit_amount, time_name) {
	return `${time_unit_amount} ${time_name}${time_unit_amount === 1 ? "" : "s"}`;
}

function addCustomOption(message, date, obj) {
	const key = `custom${customCount}`;
	obj[key] = {
		message: message,
		startDate: date,
	};
	customCount++;
	return key;
}

function saveCustomOption(message, date) {
	localStorage.setItem(
		"customs",
		JSON.stringify([...JSON.parse(localStorage.getItem("customs")) ?? [], [message, `${date.getMonth() + 1}/${date.getDay()}`]])
	);
}

function parceDate(dateText) {
	const split = dateText.split("/");
	const date = new Date(now.getFullYear(), split[0] - 1, split[1]);
	if (date.getDate() === NaN) return;
	return date;
}

function isInPast(date, now) {
	return date < now;
}

function isToday(date, now) {
	return new Date(date).setHours(0, 0, 0, 0) == new Date(now).setHours(0, 0, 0, 0);
}

function getTimeTo(date, now) {
	let delta = Math.abs(date - now) / 1000;

	const days = Math.floor(delta / 86400);
	delta -= days * 86400;

	const hours = Math.floor(delta / 3600) % 24;
	delta -= hours * 3600;

	const minutes = Math.floor(delta / 60) % 60;
	delta -= minutes * 60;

	const seconds = Math.floor(delta);

	return [days, hours, minutes, seconds];
}

function centerText(text, finalLen, char = " ") {
	finalLen -= text.length;
	finalLen = Math.ceil(finalLen / 2);
	return char.repeat(finalLen) + text + char.repeat(finalLen);
}
