const fs = require('fs');
const path = require('path');

const teamsFilePath = path.join(__dirname, '../../../data/teams.json');

// Load the teams data from the JSON file
let teamsData;
try {
  teamsData = JSON.parse(fs.readFileSync(teamsFilePath, 'utf8'));
} catch (error) {
  console.error('Error reading teams data:', error);
  process.exit(1); // Exit if there's an issue with reading the file
}

// Function to randomize the stats of a team
function randomizeStats(team) {
  if (!team.randomized) {
    team.speed = Math.floor(Math.random() * 100) + 1;
    team.agility = Math.floor(Math.random() * 100) + 1;
    team.attack = Math.floor(Math.random() * 100) + 1;
    team.defense = Math.floor(Math.random() * 100) + 1;
    team.overall = Math.round((team.speed + team.agility + team.attack + team.defense) / 4);
    team.randomized = true;
  }
}

// Iterate through all teams and randomize their stats
teamsData.forEach((sport) => {
  sport.teams.forEach((team) => {
    randomizeStats(team);
  });
});

// Save the updated teams data back to the JSON file
try {
  fs.writeFileSync(teamsFilePath, JSON.stringify(teamsData, null, 2));
  console.log('Teams stats have been randomized and updated.');
} catch (error) {
  console.error('Error writing teams data:', error);
}
