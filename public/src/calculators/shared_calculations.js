const fs = require('fs');
const path = require('path');
const rootPath = path.join(__dirname, '../../../');

// Compare team stats
function compareStats(teamA, teamB) {
  let scoreA = 0;
  let scoreB = 0;

  const comparisons = [
    { stat: 'attack', weight: 1 },
    { stat: 'defense', weight: 1 },
    { stat: 'speed', weight: 1 },
    { stat: 'agility', weight: 1 },
    { stat: 'overall', weight: 1 },
    { stat: 'attack', against: 'defense', weight: 1 },
    { stat: 'speed', against: 'agility', weight: 1 },
  ];

  comparisons.forEach(({ stat, against, weight }) => {
    const statA = teamA[stat] || 0;
    const statB = against ? teamB[against] || 0 : teamB[stat] || 0;

    if (statA > statB) {
      scoreA += weight * (statA - statB);
    } else if (statB > statA) {
      scoreB += weight * (statB - statA);
    }
  });

  return { scoreA, scoreB };
}

// Generate match scores based on sport
function generateScore(sport, scoreA, scoreB) {
  let scoreTeamA = 0;
  let scoreTeamB = 0;

  const adjustForScoreDifference = (scoreA, scoreB, averagePoints, maxPoints) => {
    if (scoreA === 0 && scoreB === 0) {
      scoreTeamA = Math.round(Math.random() * averagePoints);
      scoreTeamB = Math.round(Math.random() * averagePoints);
    } else {
      const totalScore = scoreA + scoreB;
      const randomness = Math.random() * (maxPoints - averagePoints) * 0.5;

      scoreTeamA = Math.round((scoreA / totalScore) * averagePoints + randomness);
      scoreTeamB = Math.round((scoreB / totalScore) * averagePoints + randomness);
    }
  };

  // Function to handle boxing scoring
  const generateScoreBoxing = (scoreA, scoreB) => {
    const rounds = 4;
    const knockoutThreshold = 20;
    const diceRollMax = 20;

    scoreTeamA = 0;
    scoreTeamB = 0;

    for (let i = 0; i < rounds; i++) {
      const roundRollA = Math.random() * diceRollMax;
      const roundRollB = Math.random() * diceRollMax;

      const adjustedScoreA = roundRollA + scoreA / 10;
      const adjustedScoreB = roundRollB + scoreB / 10;

      const scoreDifference = Math.abs(adjustedScoreA - adjustedScoreB);
      if (scoreDifference > knockoutThreshold) {
        if (adjustedScoreA > adjustedScoreB) {
          scoreTeamA += 10;
          scoreTeamB += 7;
        } else {
          scoreTeamA += 7;
          scoreTeamB += 10;
        }
        break;
      }

      if (adjustedScoreA > adjustedScoreB) {
        scoreTeamA += 10;
        scoreTeamB += 8 + Math.floor(Math.random() * 2);
      } else if (adjustedScoreB > adjustedScoreA) {
        scoreTeamA += 8 + Math.floor(Math.random() * 2);
        scoreTeamB += 10;
      } else {
        scoreTeamA += 10;
        scoreTeamB += 10;
      }
    }
    // console.log(scoreTeamA, scoreTeamB);
  };

  switch (sport) {
    case 'hockey':
      adjustForScoreDifference(scoreA, scoreB, 3.1, 10);
      break;
    case 'soccer':
      adjustForScoreDifference(scoreA, scoreB, 2.7, 7);
      break;
    case 'boxing':
      generateScoreBoxing(scoreA, scoreB);
      break;
    default:
      return { scoreTeamA: 0, scoreTeamB: 0 };
  }
  //   console.log(sport, scoreTeamA, scoreTeamB);
  return { scoreTeamA, scoreTeamB };
}

module.exports = {
  compareStats,
  generateScore,
};
