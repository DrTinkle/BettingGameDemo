const fs = require('fs');
const path = require('path');
const rootPath = path.join(__dirname, '../../../');

// Function to load JSON data from the file
function loadJsonData(filePath) {
  const fullPath = path.join(rootPath, '/data', filePath);
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    console.error(`Error loading JSON from ${filePath}:`, error);
    return [];
  }
}

// Odds calculation based on past match history and gathered stats
async function calculateOddsForMatchup(teamA, teamB) {
  // console.log(`Calculating odds for ${teamA} vs ${teamB}`);

  const teamStats = await gatherTeamStats(teamA, teamB); // Gather the relevant stats

  const {
    totalScoreTeamA,
    totalScoreTeamB,
    teamAWins,
    teamBWins,
    draws,
    totalMatches,
    overallTotalGamesTeamA,
    overallTotalGamesTeamB,
    overallTeamAWins,
    overallTeamBWins,
  } = teamStats;

  // Calculate average scores in the matchups between teamA and teamB
  const averageScoreTeamA = totalMatches > 0 ? (totalScoreTeamA / totalMatches).toFixed(2) : 0;
  const averageScoreTeamB = totalMatches > 0 ? (totalScoreTeamB / totalMatches).toFixed(2) : 0;

  // Calculate overall win ratios (overall games played by the teams)
  const winRatioTeamA = overallTotalGamesTeamA > 0 ? (overallTeamAWins / overallTotalGamesTeamA).toFixed(2) : 0;
  const winRatioTeamB = overallTotalGamesTeamB > 0 ? (overallTeamBWins / overallTotalGamesTeamB).toFixed(2) : 0;

  // console.log(`Calculated win ratios: teamA=${winRatioTeamA}, teamB=${winRatioTeamB}`);

  // Base odds using head-to-head data
  let oddsTeamA = totalMatches > 0 ? (totalMatches / teamAWins).toFixed(2) : '2.00';
  let oddsDraw = totalMatches > 0 ? (totalMatches / draws).toFixed(2) : '3.33';
  let oddsTeamB = totalMatches > 0 ? (totalMatches / teamBWins).toFixed(2) : '2.00';

  if (teamAWins === 0) oddsTeamA = '2.00';
  if (teamBWins === 0) oddsTeamB = '2.00';
  if (draws === 0) oddsDraw = '3.33';

  // Adjust odds based on average scores and overall win ratios
  if (averageScoreTeamA > averageScoreTeamB) {
    oddsTeamA = (parseFloat(oddsTeamA) - 0.1).toFixed(2);
    oddsTeamB = (parseFloat(oddsTeamB) + 0.1).toFixed(2);
  } else if (averageScoreTeamB > averageScoreTeamA) {
    oddsTeamB = (parseFloat(oddsTeamB) - 0.1).toFixed(2);
    oddsTeamA = (parseFloat(oddsTeamA) + 0.1).toFixed(2);
  }

  if (winRatioTeamA > winRatioTeamB) {
    oddsTeamA = (parseFloat(oddsTeamA) - 0.15).toFixed(2); // Give better odds if Team A has better overall win ratio
    oddsTeamB = (parseFloat(oddsTeamB) + 0.15).toFixed(2);
  } else if (winRatioTeamB > winRatioTeamA) {
    oddsTeamB = (parseFloat(oddsTeamB) - 0.15).toFixed(2);
    oddsTeamA = (parseFloat(oddsTeamA) + 0.15).toFixed(2);
  }

  // console.log('Final calculated odds:', {
  //   oddsTeamA,
  //   oddsDraw,
  //   oddsTeamB,
  // });

  // Return the calculated odds along with match statistics
  return {
    teamA,
    teamB,
    oddsTeamA,
    oddsDraw,
    oddsTeamB,
    teamAWins,
    teamBWins,
    draws,
    totalMatches,
    averageScoreTeamA,
    averageScoreTeamB,
    overallWinsTeamA: overallTeamAWins,
    overallWinsTeamB: overallTeamBWins,
    overallGamesTeamA: overallTotalGamesTeamA,
    overallGamesTeamB: overallTotalGamesTeamB,
    winRatioTeamA,
    winRatioTeamB,
  };
}

// Gather stats for both teams from match history using team history
async function gatherTeamStats(teamA, teamB) {
  const teamHistory = await loadJsonData('team_history.json'); // Load team history with match references
  const matchHistory = await loadJsonData('match_history.json'); // Load all match history

  // console.log('Loaded team history:', teamHistory);
  // console.log('Loaded match history:', matchHistory);

  let totalScoreTeamA = 0;
  let totalScoreTeamB = 0;
  let teamAWins = 0;
  let teamBWins = 0;
  let draws = 0;
  let totalMatches = 0;

  let overallTotalGamesTeamA = 0;
  let overallTotalGamesTeamB = 0;
  let overallTeamAWins = 0;
  let overallTeamBWins = 0;

  // Get the match references for both teams
  const teamAMatchIds = teamHistory[teamA]?.matches || [];
  const teamBMatchIds = teamHistory[teamB]?.matches || [];

  // console.log(`Match IDs for teamA (${teamA}):`, teamAMatchIds);
  // console.log(`Match IDs for teamB (${teamB}):`, teamBMatchIds);

  // Iterate over each sport's matchups in the match history
  Object.entries(matchHistory).forEach(([sport, sportData]) => {
    const matchups = sportData.matchups || [];

    // Loop through each matchup
    matchups.forEach((match) => {
      // Head-to-head performance between teamA and teamB
      if (
        teamAMatchIds.includes(match.matchId) &&
        teamBMatchIds.includes(match.matchId) &&
        ((match.teamA === teamA && match.teamB === teamB) || (match.teamA === teamB && match.teamB === teamA))
      ) {
        totalMatches++;

        // console.log(`Found head-to-head match between ${teamA} and ${teamB}:`, match);

        // Add the scores for this specific matchup
        if (match.teamA === teamA) {
          totalScoreTeamA += match.scoreTeamA;
          totalScoreTeamB += match.scoreTeamB;
        } else {
          totalScoreTeamA += match.scoreTeamB;
          totalScoreTeamB += match.scoreTeamA;
        }

        // Track match results between teamA and teamB
        if (match.winner === teamA) {
          teamAWins++;
        } else if (match.winner === teamB) {
          teamBWins++;
        } else if (match.winner === 'draw') {
          draws++;
        }
      }

      // Overall performance for teamA
      if (match.teamA === teamA || match.teamB === teamA) {
        overallTotalGamesTeamA++;
        if (match.winner === teamA) overallTeamAWins++;
      }

      // Overall performance for teamB
      if (match.teamA === teamB || match.teamB === teamB) {
        overallTotalGamesTeamB++;
        if (match.winner === teamB) overallTeamBWins++;
      }
    });
  });

  // console.log(`Stats for ${teamA} vs ${teamB}:`, {
  //   totalScoreTeamA,
  //   totalScoreTeamB,
  //   teamAWins,
  //   teamBWins,
  //   draws,
  //   totalMatches,
  //   overallTotalGamesTeamA,
  //   overallTotalGamesTeamB,
  //   overallTeamAWins,
  //   overallTeamBWins,
  // });

  return {
    totalScoreTeamA,
    totalScoreTeamB,
    teamAWins,
    teamBWins,
    draws,
    totalMatches,
    overallTotalGamesTeamA,
    overallTotalGamesTeamB,
    overallTeamAWins,
    overallTeamBWins,
  };
}

module.exports = { calculateOddsForMatchup };
