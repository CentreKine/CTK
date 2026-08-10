import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;
const dataFilePath = path.join(__dirname, 'data.json');
const distPath = path.join(__dirname, 'dist');

app.use(express.json({ limit: '10mb' }));

function now() {
  return new Date().toISOString();
}

function readData() {
  if (!fs.existsSync(dataFilePath)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeData(data) {
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, '{}', 'utf8');
  }

  const backupPath = `${dataFilePath}.${Date.now()}.bak`;
  try {
    fs.copyFileSync(dataFilePath, backupPath);
  } catch {
    // Ignore backup failures.
  }

  const tempPath = path.join(tmpdir(), `clinic-finance-${Date.now()}.json`);
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, dataFilePath);
}

function listTableItems(data, table) {
  const items = Array.isArray(data[table]) ? data[table] : [];
  return items.filter((item) => !item?.deleted_at);
}

function parseBool(value) {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value).toLowerCase() === 'true';
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'clinic-finance', timestamp: now() });
});

app.get(['/api/_export', '/api/_export/'], (_req, res) => {
  res.json(readData());
});

app.post(['/api/_import', '/api/_import/'], (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'invalid_payload' });
  }

  writeData(req.body);
  return res.json({ ok: true });
});

app.get(['/api/_backups', '/api/_backups/'], (_req, res) => {
  if (!fs.existsSync(__dirname)) {
    return res.json({ backups: [] });
  }

  const backups = fs.readdirSync(__dirname)
    .filter((name) => name.startsWith('data.json.') && name.endsWith('.bak'))
    .sort()
    .map((name) => path.join(__dirname, name));

  return res.json({ backups });
});

app.get(['/api/:table/count', '/api/:table/count/'], (req, res) => {
  const { table } = req.params;
  const data = readData();
  const items = listTableItems(data, table);
  return res.json({ count: items.length });
});

app.get(['/api/:table', '/api/:table/'], (req, res) => {
  const { table } = req.params;
  const data = readData();
  const items = listTableItems(data, table);
  const query = { ...req.query };

  let filtered = items.filter((item) => {
    return Object.entries(query).every(([key, value]) => {
      if (key === 'order' || key === 'limit') return true;
      return String(item?.[key]) === String(value);
    });
  });

  if (query.order) {
    const [field, direction = 'desc'] = String(query.order).split(':');
    filtered = [...filtered].sort((a, b) => {
      const av = a?.[field] ?? '';
      const bv = b?.[field] ?? '';
      const comparison = String(av).localeCompare(String(bv));
      return direction.toLowerCase() === 'asc' ? comparison : -comparison;
    });
  }

  if (query.limit) {
    const limit = Number(query.limit);
    filtered = filtered.slice(0, Number.isFinite(limit) ? limit : 1000);
  }

  return res.json(filtered);
});

app.post(['/api/:table', '/api/:table/'], (req, res) => {
  const { table } = req.params;
  const data = readData();
  const list = Array.isArray(data[table]) ? data[table] : [];
  const payload = { ...(req.body || {}) };

  if (!payload.id) {
    payload.id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  payload.created_at = payload.created_at || now();
  payload.updated_at = now();
  list.unshift(payload);
  data[table] = list;
  writeData(data);
  return res.status(201).json(payload);
});

app.put(['/api/:table/:id', '/api/:table/:id/'], (req, res) => {
  const { table, id } = req.params;
  const data = readData();
  const list = Array.isArray(data[table]) ? data[table] : [];
  const index = list.findIndex((item) => item.id === id && !item.deleted_at);

  if (index === -1) {
    return res.status(404).json({ error: 'not_found' });
  }

  const updated = { ...list[index], ...req.body, id, updated_at: now() };
  list[index] = updated;
  data[table] = list;
  writeData(data);
  return res.json(updated);
});

app.delete(['/api/:table/:id', '/api/:table/:id/'], (req, res) => {
  const { table, id } = req.params;
  const data = readData();
  const list = Array.isArray(data[table]) ? data[table] : [];
  const index = list.findIndex((item) => item.id === id && !item.deleted_at);

  if (index === -1) {
    return res.status(404).json({ error: 'not_found' });
  }

  list[index] = { ...list[index], deleted_at: now(), updated_at: now() };
  data[table] = list;
  writeData(data);
  return res.json(list[index]);
});

app.use(express.static(distPath, { index: false }));

app.get(/(.+)/, (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'not_found' });
  }

  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    return res.sendFile(path.join(distPath, 'index.html'));
  }

  return res.status(404).send('Not found');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Production server running on port ${port}`);
});
