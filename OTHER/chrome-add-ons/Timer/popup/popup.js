"use strict";

// Helper function to format time
function formatTime(seconds) {
    const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${secs}`;
}

// Function to display the session time for the current page
function displaySessionTime(currentUrl, timeData) {
    const sessionTimeElement = document.getElementById('session-time');
    if (timeData[currentUrl]) {
        sessionTimeElement.textContent = formatTime(timeData[currentUrl].sessionTime);
    } else {
        sessionTimeElement.textContent = 'Not Tracked';
    }
}

// Function to display daily and weekly times for all websites
function displayWebsiteTimes(timeData) {
    const timeListElement = document.getElementById('time-list');
    for (const [url, data] of Object.entries(timeData)) {
        const websiteTimeDiv = document.createElement('div');
        websiteTimeDiv.className = 'website-time';

        const websiteTitle = document.createElement('div');
        websiteTitle.className = 'website-title';
        websiteTitle.textContent = url;

        const timeDetails = document.createElement('div');
        timeDetails.className = 'time-details';
        timeDetails.innerHTML = `
            <p>Daily Time: ${formatTime(data.dailyTime)}</p>
            <p>Weekly Time: ${formatTime(data.weeklyTime)}</p>
        `;

        websiteTimeDiv.appendChild(websiteTitle);
        websiteTimeDiv.appendChild(timeDetails);
        timeListElement.appendChild(websiteTimeDiv);
    }
}

// Fetch and display data when the popup is opened
const seen = new Set()
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['timeData'], (result) => {
        
        if (seen.has(result)) {
            return;
        }
        seen.add(result)
        
        const timeData = result.timeData || {};
        displayWebsiteTimes(timeData);
    });
});
