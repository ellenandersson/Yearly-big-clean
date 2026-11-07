import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '..', 'data', 'tasks.json');
const distPath = path.join(__dirname, '..', 'dist');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/tasks', async (_req, res) => {
  try {
    const raw = await fs.readFile(dataPath, 'utf8');
    res.type('json').send(raw);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not read tasks.json' });
  }
});

app.put('/api/tasks', async (req, res) => {
  const doc = req.body;
  if (!doc || !Array.isArray(doc.rooms) || doc.rooms.some((room) => !room || typeof room.id !== 'string')) {
    res.status(400).json({ error: 'Expected a task document with rooms' });
    return;
  }

  try {
    await fs.writeFile(dataPath, `${JSON.stringify(doc, null, 2)}\n`);
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not write tasks.json' });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Tasks API on http://127.0.0.1:${port}`);
});
