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

// add each holiday to menu
for (const [name, holiday] of Object.entries(holidays)) {
	const option = document.createElement("option");
	option.value = name;
	option.innerText = holiday.message;
	selectHolidayInput.add(option);
}

function isInPast(date) {
	return date < now;
}

function isToday(date) {
	return date.setHours(0, 0, 0, 0) == new Date().setHours(0, 0, 0, 0);
}

function getTimeTo(date) {
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

let holidayId = localStorage.getItem("current") ?? Object.entries(holidays)[0][0];
selectHolidayInput.value = holidayId;

selectHolidayInput.onchange = (event) => {
	if (event.target.value == "han") {
		setTimeout(() => {
			alert("Unknown start date because I don't know how Hebrew calendar works or how to code that. Sorry!");
			selectHolidayInput.value = holidayId;
		}, 200);
		return;
	}

	holidayId = event.target.value;
	localStorage.setItem("current", holidayId);
};

setInterval(() => {
	now = new Date();

	const holiday = holidays[holidayId];

	let [days, hours, minutes, seconds] = getTimeTo(holiday.startDate);

	if (isToday(holiday.startDate)) {
		[days, hours, minutes, seconds] = [0, 0, 0, 0];
	} else if (isInPast(holiday.startDate)) {
		holiday.startDate.setFullYear(holiday.startDate.getFullYear() + 1);
	}

	const daysRoundedUp = days + Boolean(hours || minutes || seconds);
	
	message.innerText = `${holiday.message} ${"Eve ".repeat(daysRoundedUp)}`;
	message.title = `${holiday.message} Eve × ${daysRoundedUp}`;

	countDownClockElement.innerText = [
		makeClockFormat(days),
		makeClockFormat(hours),
		makeClockFormat(minutes),
		makeClockFormat(seconds),
	].join(":");

	countDownClockElement.title = `${makeClockTitleFormat(days, "day")}, ${makeClockTitleFormat(hours, "hour")}, ${makeClockTitleFormat(minutes, "minute")}, and ${makeClockTitleFormat(seconds, "second")} to ${holiday.startDate.toString().split("00:00:00")[0]}`
	
});


function makeClockFormat(time_unit_amount, padding = 2) {
	return String(time_unit_amount).padStart(padding, "0");
}

function makeClockTitleFormat(time_unit_amount, time_name) {
	return `${time_unit_amount} ${time_name}${time_unit_amount === 1 ? "" : "s"}`;
}
