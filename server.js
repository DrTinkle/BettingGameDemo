const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { handleNextMatch } = require('./public/src/handlers/match_handler');
const { calculateOddsForMatchup } = require('./public/src/calculators/odds_calculator.js');
const app = express();

app.use(express.json({ limit: '10mb' })); // To parse JSON request bodies

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve data files from the 'data' directory
app.use('/data', express.static(path.join(__dirname, 'data')));

// Serve simulator files
app.use('/src/randomizer', express.static(path.join(__dirname, 'public/src/randomizer')));

// Route for the main page (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Run the scheduler script when the server starts
exec('node ./public/src/scheduler/scheduler.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing scheduler: ${error}`);
    return;
  }
  if (stderr) {
    console.error(`Scheduler stderr: ${stderr}`);
  }
  console.log(`Scheduler output: ${stdout}`);
});

// API to run the scheduler.js script
app.get('/api/run-scheduler', (req, res) => {
  exec('node ./public/src/scheduler/scheduler.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing scheduler: ${error}`);
      return res.status(500).json({ error: 'Error running scheduler' });
    }
    if (stderr) {
      console.error(`Scheduler stderr: ${stderr}`);
    }
    console.log(`Scheduler output: ${stdout}`);
    res.json({ message: 'Scheduler ran successfully', output: stdout });
  });
});

// Load schedule data
app.get('/api/schedule', (req, res) => {
  const schedulePath = path.join(__dirname, 'data/schedule.json');
  try {
    const scheduleData = fs.readFileSync(schedulePath, 'utf-8');
    res.json(JSON.parse(scheduleData));
  } catch (error) {
    console.error('Error loading schedule data:', error);
    res.status(500).json({ error: 'Failed to load schedule data' });
  }
});

// Load match history data
app.get('/api/match-history', (req, res) => {
  const matchHistoryPath = path.join(__dirname, 'data/match_history.json');
  try {
    const matchHistory = fs.readFileSync(matchHistoryPath, 'utf-8');
    res.json(JSON.parse(matchHistory));
  } catch (error) {
    console.error('Error loading match history:', error);
    res.status(500).json({ error: 'Failed to load match history' });
  }
});

// Load team history data
app.get('/api/team-history', (req, res) => {
  const teamHistoryPath = path.join(__dirname, 'data/team_history.json');
  try {
    const teamHistory = fs.readFileSync(teamHistoryPath, 'utf-8');
    res.json(JSON.parse(teamHistory));
  } catch (error) {
    console.error('Error loading team history:', error);
    res.status(500).json({ error: 'Failed to load team history' });
  }
});

// Load teams data
app.get('/api/teams', (req, res) => {
  const teamsPath = path.join(__dirname, 'data/teams.json');
  try {
    const teamsData = fs.readFileSync(teamsPath, 'utf-8');
    res.json(JSON.parse(teamsData));
  } catch (error) {
    console.error('Error loading teams data:', error);
    res.status(500).json({ error: 'Failed to load teams data' });
  }
});

// Save match history data
app.post('/api/save-match-history', (req, res) => {
  const matchHistory = req.body;
  const matchHistoryPath = path.join(__dirname, 'data/match_history.json');
  fs.writeFileSync(matchHistoryPath, JSON.stringify(matchHistory, null, 2));
  res.json({ success: true });
});

// Save team history data
app.post('/api/save-team-history', (req, res) => {
  const teamHistory = req.body;
  const teamHistoryPath = path.join(__dirname, 'data/team_history.json');
  fs.writeFileSync(teamHistoryPath, JSON.stringify(teamHistory, null, 2));
  res.json({ success: true });
});

// Save schedule data
app.post('/api/save-schedule', (req, res) => {
  const schedule = req.body;
  const schedulePath = path.join(__dirname, 'data/schedule.json');
  fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2));
  res.json({ success: true });
});

// API to calculate odds
app.get('/api/calculate-odds', async (req, res) => {
  const { teamA, teamB } = req.query;
  if (!teamA || !teamB) {
    return res.status(400).json({ error: 'Missing teamA or teamB in query' });
  }
  try {
    const odds = await calculateOddsForMatchup(teamA, teamB);
    res.json(odds);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate odds' });
  }
});

// API to trigger next match
app.post('/api/next-match', async (req, res) => {
  try {
    await handleNextMatch();
    res.json({ success: true });
  } catch (error) {
    console.error('Error handling next match:', error);
    res.status(500).json({ error: 'Failed to handle next match' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
