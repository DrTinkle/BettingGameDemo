const { compareStats, generateScore } = require('../calculators/shared_calculations');
const { calculateOddsForMatchup } = require('../calculators/odds_calculator');
const fs = require('fs');
const path = require('path');
const rootPath = path.join(__dirname, '../../../');

// Function to load data from JSON files
function loadJsonData(fileName) {
  const filePath = path.join(rootPath, `data/${fileName}.json`);
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading data from ${filePath}:`, error);
    return null;
  }
}

// Function to save data to JSON files
function saveJsonData(fileName, data) {
  const filePath = path.join(rootPath, `data/${fileName}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error saving data to ${filePath}:`, error);
  }
}

// Main handler for the next match
async function handleNextMatch() {
  const scheduleData = loadJsonData('schedule');
  let matchHistory = loadJsonData('match_history');
  const teamHistory = loadJsonData('team_history');
  const teamsData = loadJsonData('teams');

  // Ensure matchHistory is initialized as an array per sport
  if (!matchHistory) matchHistory = {};

  // Find the next match to be played for each sport based on `order`
  Object.keys(scheduleData).forEach(async (sport) => {
    const sportMatchups = scheduleData[sport]?.matchups || [];

    // Find the next match to be played based on the lowest `order`
    const nextMatch = sportMatchups.sort((a, b) => a.order - b.order)[0]; // Get the next match by order

    if (nextMatch) {
      // Fetch team stats for the sport
      const sportTeams = teamsData.find((entry) => entry.sport === sport)?.teams || [];
      const teamAStats = sportTeams.find((team) => team.name === nextMatch.teamA);
      const teamBStats = sportTeams.find((team) => team.name === nextMatch.teamB);

      if (!teamAStats || !teamBStats) {
        console.error(`Error fetching stats for ${nextMatch.teamA} or ${nextMatch.teamB}.`);
        return;
      }

      // Compare team stats and generate score
      const { scoreA, scoreB } = compareStats(teamAStats, teamBStats);
      const { scoreTeamA, scoreTeamB } = generateScore(sport, scoreA, scoreB);
      nextMatch.result = `${nextMatch.teamA} ${scoreTeamA} - ${scoreTeamB} ${nextMatch.teamB}`;

      // Calculate odds using calculateOddsForMatchup
      const odds = await calculateOddsForMatchup(nextMatch.teamA, nextMatch.teamB);

      // Determine the winner
      nextMatch.winner =
        scoreTeamA === scoreTeamB ? 'draw' : scoreTeamA > scoreTeamB ? nextMatch.teamA : nextMatch.teamB;

      // Append the match result to matchHistory
      if (!matchHistory[sport]) {
        matchHistory[sport] = { matchups: [] };
      }

      const order = matchHistory[sport].matchups.length + 1;

      // Append the match to matchHistory with the original order and matchId
      matchHistory[sport].matchups.push({
        teamA: nextMatch.teamA,
        teamB: nextMatch.teamB,
        matchId: nextMatch.matchId, // Use the pre-set matchId from the scheduler
        scoreTeamA,
        scoreTeamB,
        winner: nextMatch.winner,
        order: order,
      });

      // Add the matchId to teamHistory for both teams
      if (!teamHistory[nextMatch.teamA]) {
        teamHistory[nextMatch.teamA] = { matches: [] };
      }
      if (!teamHistory[nextMatch.teamB]) {
        teamHistory[nextMatch.teamB] = { matches: [] };
      }
      teamHistory[nextMatch.teamA].matches.push(nextMatch.matchId); // Add matchId for teamA
      teamHistory[nextMatch.teamB].matches.push(nextMatch.matchId); // Add matchId for teamB

      // Remove the match from the schedule (it's now complete)
      scheduleData[sport].matchups = scheduleData[sport].matchups.filter((m) => m !== nextMatch);

      // Save the updated match history and schedule
      saveJsonData('match_history', matchHistory);
      saveJsonData('schedule', scheduleData);
      saveJsonData('team_history', teamHistory); // Save the updated teamHistory

      console.log(
        `Processed match: ${nextMatch.teamA} vs ${nextMatch.teamB} (Match ID: ${nextMatch.matchId}, Order: ${order})`
      );
    }
  });
}

module.exports = { handleNextMatch };
