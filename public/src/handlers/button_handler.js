// Function to run the entire scheduler.js script
function runScheduler() {
  fetch('/api/run-scheduler')
    .then((response) => response.json())
    .catch((error) => console.error('Error running scheduler:', error));
}

// Function to load the saved schedule
function loadSchedule() {
  fetch('/api/load-schedule')
    .then((response) => response.json())
    .then((data) => {
      console.log('Loaded Schedule:', data);
      document.getElementById('scheduleOutput').textContent = JSON.stringify(data, null, 2);
    })
    .catch((error) => console.error('Error loading schedule:', error));
}

// Function to update match history
function updateMatchHistory() {
  const matchData = {
    matchId: 1, // Example match ID
    result: 'Team A 2 - 1 Team B', // Example result
  };

  fetch('/api/update-match-history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(matchData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('Updated Match History:', data);
    })
    .catch((error) => console.error('Error updating match history:', error));
}

// Attach event listeners to buttons when the page loads
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('generateScheduleBtn').addEventListener('click', runScheduler);
});
