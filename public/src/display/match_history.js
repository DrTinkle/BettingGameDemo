// Load team history data from team_history.json
async function loadTeamHistory() {
  try {
    const response = await fetch('../../data/team_history.json');
    const teamHistory = await response.json();
    return teamHistory;
  } catch (error) {
    console.error('Error loading team history:', error);
  }
}

// Load full match details from match_history.json
async function loadFullMatchHistory() {
  try {
    const response = await fetch('../../data/match_history.json');
    const matchHistory = await response.json();
    return matchHistory;
  } catch (error) {
    console.error('Error loading full match history:', error);
  }
}

// Function to update the match history for a selected team
async function updateTeamHistory(teamName) {
  const teamHistory = await loadTeamHistory();
  const fullMatchHistory = await loadFullMatchHistory();

  // Find the team's history by name
  const team = teamHistory[teamName];

  if (!team) {
    console.error(`Team history for ${teamName} not found.`);
    return;
  }

  // Limit to the last 10 matches and reverse the order so that the newest match is on top
  const recentMatches = team.matches.slice(-10).reverse(); // Get the last 10 matches and reverse the order

  // Clear the existing list
  const teamHistoryList = document.getElementById('teamHistoryList');
  teamHistoryList.innerHTML = '';

  // Populate the match history list with match details
  recentMatches.forEach((matchId) => {
    let matchFound = false;

    // Iterate over each sport's matchups in the match history
    Object.entries(fullMatchHistory).forEach(([sport, sportData]) => {
      if (sportData.matchups) {
        // Find the match by matchId within the sport's matchups
        const match = sportData.matchups.find((m) => m.matchId === matchId);
        if (match) {
          const listItem = document.createElement('li');
          listItem.textContent = `${match.teamA} ${match.scoreTeamA} - ${match.scoreTeamB} ${match.teamB} (Winner: ${match.winner})`;
          teamHistoryList.appendChild(listItem);
          matchFound = true;
        }
      }
    });

    if (!matchFound) {
      const listItem = document.createElement('li');
      listItem.textContent = `Match ID: ${matchId} (Details not found)`;
      teamHistoryList.appendChild(listItem);
    }
  });
}

// Function to populate the team options based on selected sport
async function populateTeamOptions(sport) {
  const teamsData = await loadTeamsData();
  console.log('Teams Data:', teamsData); // Log to check if data is loaded correctly

  // Find the sport object that matches the selected sport
  const sportObject = teamsData.find((entry) => entry.sport === sport);
  console.log('Sport Object:', sportObject); // Log to check the sport object

  // Get the teams for the selected sport or default to an empty array
  const sportTeams = sportObject ? sportObject.teams : [];

  const teamSelect = document.getElementById('teamSelect');
  teamSelect.innerHTML = ''; // Clear previous options

  // Populate the team selection dropdown
  sportTeams.forEach((team) => {
    const option = document.createElement('option');
    option.value = team.name;
    option.textContent = team.name;
    teamSelect.appendChild(option);
  });

  // Automatically update the team history when the first team is selected
  if (sportTeams.length > 0) {
    updateTeamHistory(sportTeams[0].name);
  }
}

// Load team data (assuming teams.json is available)
async function loadTeamsData() {
  try {
    const response = await fetch('../data/teams.json');
    const teamsData = await response.json();
    console.log('Fetched Teams Data:', teamsData); // Log the fetched data
    return teamsData;
  } catch (error) {
    console.error('Error loading teams data:', error);
  }
}

// Ensure DOM is fully loaded before adding event listeners
document.addEventListener('DOMContentLoaded', function () {
  // Event listener for team selection change
  const teamSelect = document.getElementById('teamSelect');
  teamSelect.addEventListener('change', function (event) {
    const selectedTeam = event.target.value;
    updateTeamHistory(selectedTeam); // Update the match history when a new team is selected
  });

  // Event listener for sport selection change (to repopulate team options)
  const sportSelect = document.getElementById('sportSelect');
  sportSelect.addEventListener('change', function (event) {
    const selectedSport = event.target.value;
    populateTeamOptions(selectedSport); // Populate teams based on the selected sport
  });

  // Initial load for sport and team options
  populateTeamOptions(sportSelect.value); // Load the first sport's teams on page load
});
