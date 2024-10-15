const { compareStats, generateScore } = require('../calculators/shared_calculations');
const { calculateOddsForMatchup } = require('../calculators/odds_calculator');
const fs = require('fs');
const path = require('path');
const rootPath = path.join(__dirname, '../../../');

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

function saveJsonData(fileName, data) {
  const filePath = path.join(rootPath, `data/${fileName}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error saving data to ${filePath}:`, error);
  }
}

async function handleNextMatch() {
  const scheduleData = loadJsonData('schedule');
  let matchHistory = loadJsonData('match_history');
  const teamHistory = loadJsonData('team_history');
  const teamsData = loadJsonData('teams');

  if (!matchHistory) matchHistory = {};

  // Find the next match to be played for each sport based on `order`
  Object.keys(scheduleData).forEach(async (sport) => {
    const sportMatchups = scheduleData[sport]?.matchups || [];

    // Find the next match to be played based on the lowest `order`
    const nextMatch = sportMatchups.sort((a, b) => a.order - b.order)[0];

    if (nextMatch) {
      const sportTeams = teamsData.find((entry) => entry.sport === sport)?.teams || [];
      const teamAStats = sportTeams.find((team) => team.name === nextMatch.teamA);
      const teamBStats = sportTeams.find((team) => team.name === nextMatch.teamB);

      if (!teamAStats || !teamBStats) {
        console.error(`Error fetching stats for ${nextMatch.teamA} or ${nextMatch.teamB}.`);
        return;
      }

      const { scoreA, scoreB } = compareStats(teamAStats, teamBStats);
      const { scoreTeamA, scoreTeamB } = generateScore(sport, scoreA, scoreB);
      nextMatch.result = `${nextMatch.teamA} ${scoreTeamA} - ${scoreTeamB} ${nextMatch.teamB}`;

      const odds = await calculateOddsForMatchup(nextMatch.teamA, nextMatch.teamB);

      nextMatch.winner =
        scoreTeamA === scoreTeamB ? 'draw' : scoreTeamA > scoreTeamB ? nextMatch.teamA : nextMatch.teamB;

      if (!matchHistory[sport]) {
        matchHistory[sport] = { matchups: [] };
      }

      const order = matchHistory[sport].matchups.length + 1;

      matchHistory[sport].matchups.push({
        teamA: nextMatch.teamA,
        teamB: nextMatch.teamB,
        matchId: nextMatch.matchId,
        scoreTeamA,
        scoreTeamB,
        winner: nextMatch.winner,
        order: order,
      });

      // if (!teamHistory[nextMatch.teamA]) {
      //   teamHistory[nextMatch.teamA] = { matches: [] };
      // }
      // if (!teamHistory[nextMatch.teamB]) {
      //   teamHistory[nextMatch.teamB] = { matches: [] };
      // }
      // teamHistory[nextMatch.teamA].matches.push(nextMatch.matchId);
      // teamHistory[nextMatch.teamB].matches.push(nextMatch.matchId);

      // Remove the match from the schedule
      scheduleData[sport].matchups = scheduleData[sport].matchups.filter((m) => m !== nextMatch);

      saveJsonData('match_history', matchHistory);
      saveJsonData('schedule', scheduleData);
      saveJsonData('team_history', teamHistory);

      console.log(
        `Processed match: ${nextMatch.teamA} vs ${nextMatch.teamB} (Match ID: ${nextMatch.matchId}, Order: ${order})`
      );
    }
  });
}

module.exports = { handleNextMatch };
