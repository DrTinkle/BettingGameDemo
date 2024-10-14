const { compareStats, generateScore } = require('../calculators/shared_calculations');
const fs = require('fs');
const path = require('path');
const rootPath = path.join(__dirname, '../../../');
let matchCounter = 1;

// Load JSON data from a file
function loadJsonData(filePath) {
  const fullPath = path.join(`${rootPath}data/`, filePath);

  // Check if the file exists, if not, create it with an empty object
  if (!fs.existsSync(fullPath)) {
    saveJsonData(filePath, {}); // Create the file with an empty object
  }

  // Now safely read the file
  const data = fs.readFileSync(fullPath);
  return JSON.parse(data);
}

// Save JSON data to a file
function saveJsonData(filePath, data) {
  const fullPath = path.join(rootPath, 'data', filePath);
  try {
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error saving file ${fullPath}:`, error);
  }
}

// Main function to generate the schedule
function generateSchedule() {
  // Update paths to go up two directories from src/scheduler to the root, and into /data
  const teamsData = loadJsonData('teams.json');
  let scheduleData = {};
  let matchHistoryData = {};

  // Generate the schedule for each sport
  teamsData.forEach((sport) => {
    scheduleData[sport.sport] = {
      matchups: generateTournamentSchedule(sport.teams),
    };
    matchHistoryData[sport.sport] = {
      matchups: generateTournamentSchedule(sport.teams),
    };
  });

  // Randomize past match results
  randomizePastMatchResults(matchHistoryData);

  // Save the updated schedule data
  saveJsonData('schedule.json', scheduleData);
  console.log('schedule.json saved');
}

// Generate tournament schedule between teams, ensuring half are listed as teamA and half as teamB
function generateTournamentSchedule(teams) {
  let matchups = [];

  // Generate all possible pairings between teams
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matchups.push({
        teamA: teams[i].name,
        teamB: teams[j].name,
        matchId: matchCounter++, // Assign unique matchId
        scoreTeamA: 0, // Default score for team A
        scoreTeamB: 0, // Default score for team B
        winner: null, // Default winner as null (until a winner is decided)
      });
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

// Fisher-Yates shuffle algorithm for better randomization
function fisherYatesShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

function randomizePastMatchResults(scheduleData) {
  clearHistories();

  Object.entries(scheduleData).forEach(([sport, sportData]) => {
    if (sportData.matchups) {
      sportData.matchups.forEach((match, index) => {
        const teamA = teamHistory[match.teamA] || {};
        const teamB = teamHistory[match.teamB] || {};

        // Generate scores based on team stats or logic
        const { scoreA, scoreB } = compareStats(teamA, teamB);
        const { scoreTeamA, scoreTeamB } = generateScore(sport, scoreA, scoreB);

        // Update the match with results
        match.scoreTeamA = scoreTeamA;
        match.scoreTeamB = scoreTeamB;
        match.winner = scoreTeamA > scoreTeamB ? match.teamA : scoreTeamB > scoreTeamA ? match.teamB : 'draw';
        match.order = index + 1; // Set the order of the match
        match.matchId = match.matchId || `match_${matchHistory.length + 1}`; // Assign unique matchId

        // Update team history with match IDs
        if (!teamHistory[match.teamA]) {
          teamHistory[match.teamA] = { matches: [] };
        }
        if (!teamHistory[match.teamB]) {
          teamHistory[match.teamB] = { matches: [] };
        }
        teamHistory[match.teamA].matches.push(match.matchId);
        teamHistory[match.teamB].matches.push(match.matchId);
      });
    }
  });

  // Save the updated match and team histories
  saveJsonData('match_history.json', scheduleData); // Save scheduleData as match_history.json with results
  saveJsonData('team_history.json', teamHistory); // Save team history
  console.log('match_history.json and team_history.json saved');
}

function clearHistories() {
  // Clear match history
  matchHistory = [];
  saveJsonData('match_history.json', matchHistory);

  // Clear team history
  teamHistory = {};
  saveJsonData('team_history.json', teamHistory);
  console.log('Team and match history cleared.');
}

// Generate the schedule when running the script
generateSchedule();
