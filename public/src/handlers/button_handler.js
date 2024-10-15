function runScheduler() {
  fetch('/api/run-scheduler')
    .then((response) => response.json())
    .catch((error) => console.error('Error running scheduler:', error));
}

// function loadSchedule() {
//   fetch('/api/load-schedule')
//     .then((response) => response.json())
//     .then((data) => {
//       // console.log('Loaded Schedule:', data);
//       document.getElementById('scheduleOutput').textContent = JSON.stringify(data, null, 2);
//     })
//     .catch((error) => console.error('Error loading schedule:', error));
// }

// function updateMatchHistory() {
//   const matchData = {
//     matchId: 1,
//     result: 'Team A 2 - 1 Team B',
//   };

//   fetch('/api/update-match-history', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(matchData),
//   })
//     .then((response) => response.json())
//     .then((data) => {
//       console.log('Updated Match History:', data);
//     })
//     .catch((error) => console.error('Error updating match history:', error));
// }

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('generateScheduleBtn').addEventListener('click', runScheduler);
});
