// Helper function to format time
function formatTime(seconds) {
    const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${secs}`;
}

// Function to create the popup with a canvas clock
function createPopup() {
    const popup = document.createElement('div');
    popup.id = 'time-tracker-popup';
    popup.style.position = 'fixed';
    popup.style.bottom = '20px';
    popup.style.right = '20px';
    popup.style.width = '250px';
    popup.style.padding = '15px';
    popup.style.backgroundColor = '#333';
    popup.style.color = '#fff';
    popup.style.borderRadius = '8px';
    popup.style.fontFamily = 'Arial, sans-serif';
    popup.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.5)';
    popup.style.zIndex = '9999';
    popup.style.fontSize = '16px';
    popup.style.userSelect = 'none';
    
    // Create content
    popup.innerHTML = `
        <h3 style="margin: 0 0 10px; font-size: 16px; text-align: center;">Time Tracker</h3>
		<div style="display: flex; align-items: center;">
		<div>
        <p style="margin: 5px 0;">Session: <span id="session-time">00:00:00</span></p>
        <p style="margin: 5px 0;">Today: <span id="daily-time">00:00:00</span></p>
        <p style="margin: 5px 0;">This Week: <span id="weekly-time">00:00:00</span></p>
		</div>
        <canvas id="clock-canvas" width="60" height="60" style="display: block; margin: 10px auto;"></canvas>
		</div>
    `;

    document.body.appendChild(popup);
}

// Function to update the popup
function updatePopup(sessionTime, dailyTime, weeklyTime) {
    document.getElementById('session-time').textContent = formatTime(sessionTime);
    document.getElementById('daily-time').textContent = formatTime(dailyTime);
    document.getElementById('weekly-time').textContent = formatTime(weeklyTime);
}

// Function to draw the clock based on the session time
function drawClock(sessionTime) {

    const canvas = document.getElementById('clock-canvas');
    const ctx = canvas.getContext('2d');
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the clock face
    ctx.beginPath();
    ctx.arc(30, 30, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#222';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Get the current session hours and minutes
    const hours = Math.floor(sessionTime / 3600) % 12;
    const minutes = Math.floor((sessionTime % 3600) / 60);

    // Calculate angles for the hands
    const minuteAngle = (Math.PI / 30) * minutes - Math.PI / 2;
    const hourAngle = (Math.PI / 6) * hours + (Math.PI / 360) * minutes - Math.PI / 2;

    // Draw minute hand
    ctx.beginPath();
    ctx.moveTo(30, 30);
    ctx.lineTo(30 + 20 * Math.cos(minuteAngle), 30 + 20 * Math.sin(minuteAngle));
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw hour hand
    ctx.beginPath();
    ctx.moveTo(30, 30);
    ctx.lineTo(30 + 15 * Math.cos(hourAngle), 30 + 15 * Math.sin(hourAngle));
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Function to reset counters if a new day or week has started
function resetTimeData(timeData, url) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentWeek = `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`;
    
    // Reset daily time if a new day has started
    if (timeData[url].lastDay !== today) {
        timeData[url].dailyTime = 0;
        timeData[url].lastDay = today;
    }

    // Reset weekly time if a new week has started
    if (timeData[url].lastWeek !== currentWeek) {
        timeData[url].weeklyTime = 0;
        timeData[url].lastWeek = currentWeek;
    }
}

// Function to track time
function trackTime() {
    const url = window.location.hostname;

    // Load data from storage
    chrome.storage.local.get(['timeData'], (result) => {
        let timeData = result.timeData || {};

        // Initialize or reset the data for the current site
        if (!timeData[url]) {
            timeData[url] = {
                sessionTime: 0,
                dailyTime: 0,
                weeklyTime: 0,
                lastDay: new Date().toISOString().split('T')[0],
                lastWeek: `${new Date().getFullYear()}-W${Math.ceil(new Date().getDate() / 7)}`
            };
        } else {
            // Reset time data if a new day or week has started
            resetTimeData(timeData, url);

            // Reset session time if the page is reopened
            timeData[url].sessionTime = 0;
        }

        // Display the popup
        createPopup();

        let intervalId = setInterval(() => {
            // Increment time
            timeData[url].sessionTime++;
            timeData[url].dailyTime++;
            timeData[url].weeklyTime++;

            // Save updated data to storage
            chrome.storage.local.set({ timeData });

            // Update the popup with the new times
            updatePopup(timeData[url].sessionTime, timeData[url].dailyTime, timeData[url].weeklyTime);

            // Update the clock
            drawClock(timeData[url].sessionTime);
        }, 1000);

        // Clear interval when the tab is not active
        window.addEventListener('unload', () => {
            clearInterval(intervalId);
        });
    });
}

// Run the tracking function when the content script is loaded
trackTime();
