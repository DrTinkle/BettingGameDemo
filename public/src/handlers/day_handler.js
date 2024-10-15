function setupNextDayButton() {
  document.getElementById('nextDay').addEventListener('click', async () => {
    try {
      const response = await fetch('/api/next-match', {
        method: 'POST',
      });

      const result = await response.json();
      if (result.success) {
        console.log('Next match processed successfully');
        listNextMatchups();
      } else {
        console.error('Failed to process the next match');
      }
    } catch (error) {
      console.error('Error calling next match API:', error);
    }
  });
}

async function loadScheduleData() {
  try {
    const response = await fetch('/api/schedule');
    const scheduleData = await response.json();
    return scheduleData;
  } catch (error) {
    console.error('Error loading schedule data:', error);
  }
}

async function fetchOdds(teamA, teamB) {
  try {
    const response = await fetch(`/api/calculate-odds?teamA=${teamA}&teamB=${teamB}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch odds for ${teamA} vs ${teamB}: ${response.statusText}`);
    }

    const odds = await response.json();
    // console.log(`API Response for odds:`, odds);
    return odds;
  } catch (error) {
    console.error('Error fetching odds:', error);
    return {};
  }
}

async function listNextMatchups() {
  const scheduleData = await loadScheduleData();
  const matchupsList = document.getElementById('upcomingMatchupsList');
  matchupsList.innerHTML = '';

  // Loop through each sport in the schedule
  for (const sport of Object.keys(scheduleData)) {
    const sportMatchups = scheduleData[sport]?.matchups;

    if (!sportMatchups || sportMatchups.length === 0) {
      console.error(`No matchups found for ${sport}`);
      continue;
    }

    // Create a subtitle for the sport
    const sportTitle = document.createElement('h3');
    sportTitle.textContent = `${sport.charAt(0).toUpperCase() + sport.slice(1)} Upcoming Match`;
    matchupsList.appendChild(sportTitle);

    const firstMatch = sportMatchups[0];

    // Fetch odds from the API    let odds;
    try {
      odds = await fetchOdds(firstMatch.teamA, firstMatch.teamB);
      //   console.log(`Odds for ${firstMatch.teamA} vs ${firstMatch.teamB}:`, odds);
    } catch (error) {
      console.error(`Error fetching odds for ${firstMatch.teamA} vs ${firstMatch.teamB}:`, error);
      odds = {};
    }

    // Display odds for the match
    const oddsTeamA = odds?.oddsTeamA !== undefined ? odds.oddsTeamA : 'N/A';
    const oddsDraw = odds?.oddsDraw !== undefined ? odds.oddsDraw : 'N/A';
    const oddsTeamB = odds?.oddsTeamB !== undefined ? odds.oddsTeamB : 'N/A';

    // Create a list item for the matchup and odds
    const listItem = document.createElement('li');
    listItem.innerHTML = `<span>${firstMatch.teamA} vs ${firstMatch.teamB}</span> 
                            <span>Odds: ${oddsTeamA} | ${oddsDraw} | ${oddsTeamB}</span>`;
    matchupsList.appendChild(listItem);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupNextDayButton();
  listNextMatchups();
});
