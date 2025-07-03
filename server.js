const express = require('express');
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const app = express();
const port = 3000;

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// API endpoint to get the list of .json files
app.get('/api/files', async (req, res) => {
  try {
    const files = await glob('pvfCourse/**/*.json', { cwd: __dirname });
    const fileData = files.map(file => ({
      path: file,
      name: path.basename(file),
    }));
    res.json(fileData);
  } catch (err) {
    res.status(500).send('Error scanning files');
  }
});

// API endpoint to get the content of a specific file
app.get('/api/content', (req, res) => {
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).send('File path is required');
  }

  // Security: Ensure the path is within the pvfCourse directory
  const safeBasePath = path.resolve(path.join(__dirname, 'pvfCourse'));
  const requestedPath = path.resolve(path.join(__dirname, filePath));

  if (!requestedPath.startsWith(safeBasePath)) {
    return res.status(403).send('Access denied');
  }

  fs.readFile(requestedPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(404).send('File not found');
    }
    try {
      const jsonContent = JSON.parse(data);
      res.json(jsonContent);
    } catch (parseErr) {
      res.status(500).send('Error parsing JSON file');
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});