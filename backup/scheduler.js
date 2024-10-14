const fs = require('fs');
const path = require('path');
const rootPath = path.join(__dirname, '../../../');
const { randomizePastMatchResults } = require('../simulator/match_result_randomizer');

// Fisher-Yates shuffle algorithm for better randomization
function fisherYatesShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

// Generate tournament schedule between teams, ensuring half are listed as teamA and half as teamB
function generateTournamentSchedule(teams) {
  let matchups = [];

  // Generate all possible pairings between teams
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matchups.push({ teamA: teams[i].name, teamB: teams[j].name, result: null });
    }
  }

  // Shuffle the matchups to randomize the order
  matchups = fisherYatesShuffle(matchups);

  // Now, ensure that each team is listed as teamA in half of their matches and teamB in the other half
  const teamMatchCounts = {}; // Track how many times each team is listed as teamA

  // Initialize the match count for each team
  teams.forEach((team) => {
    teamMatchCounts[team.name] = { teamA: 0, teamB: 0 };
  });

  matchups.forEach((matchup) => {
    const { teamA, teamB } = matchup;

    // If teamA has been teamA too many times, swap with teamB
    if (
      teamMatchCounts[teamA].teamA > teamMatchCounts[teamA].teamB &&
      teamMatchCounts[teamB].teamB > teamMatchCounts[teamB].teamA
    ) {
      [matchup.teamA, matchup.teamB] = [teamB, teamA]; // Swap to balance
    }

    // Update the match counts
    teamMatchCounts[matchup.teamA].teamA += 1;
    teamMatchCounts[matchup.teamB].teamB += 1;
  });

  matchups.forEach((matchup, index) => {
    matchup.order = index + 1;
  });

  return matchups;
}

// Load JSON data from a file
function loadJsonData(filePath) {
  const data = fs.readFileSync(path.join(rootPath, filePath));
  return JSON.parse(data);
}

// Save JSON data to a file
function saveJsonData(filePath, data) {
  fs.writeFileSync(path.join(rootPath, filePath), JSON.stringify(data, null, 2));
}

// Main function to generate the schedule
function generateSchedule() {
  // Update paths to go up two directories from src/scheduler to the root, and into /data
  const teamsData = loadJsonData('data/teams.json');
  let scheduleData = loadJsonData('data/schedule.json') || {};

  // Generate the schedule for each sport
  teamsData.forEach((sport) => {
    const season = {
      pastMatchups: generateTournamentSchedule(sport.teams),
      matchups: generateTournamentSchedule(sport.teams),
    };
    scheduleData[sport.sport] = { season };
  });

  // Randomize past match results
  randomizePastMatchResults(scheduleData);

  // Save the updated schedule data
  saveJsonData('data/schedule.json', scheduleData);

  // Generate and display a summary of the schedule
  let scheduleSummary = '';
  Object.entries(scheduleData).forEach(([sport, sportData]) => {
    scheduleSummary += `Sport: ${sport}\n`;
    if (sportData.season) {
      scheduleSummary += 'Past Matchups:\n';
      sportData.season.pastMatchups.forEach((match) => {
        scheduleSummary += `Order ${match.order}: ${match.teamA} (Home) vs ${match.teamB} (Away), Result: ${match.result}\n`;
      });
      scheduleSummary += 'Upcoming Matchups:\n';
      sportData.season.matchups.forEach((match) => {
        scheduleSummary += `Order ${match.order}: ${match.teamA} (Home) vs ${match.teamB} (Away), Result: ${match.result}\n`;
      });
    }
    scheduleSummary += '\n';
  });

  // Save the schedule summary
  saveJsonData('data/schedule_summary.txt', scheduleSummary);
}

// Generate the schedule when running the script
generateSchedule();
