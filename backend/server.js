// ===============================
//  CloudPulse Backend Server
//  Author: Rondasha "Gabby" Bonds
// ===============================

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ===============================
// Mock Cloud Instances
// ===============================
const instances = [
  { id: 'i-0a12', name: 'web-1', region: 'us-east-1' },
  { id: 'i-0b34', name: 'api-1', region: 'us-east-1' },
  { id: 'i-0c56', name: 'worker-1', region: 'us-west-2' }
];

// Store rolling metrics history
const history = {};
instances.forEach(i => (history[i.id] = []));

// Utility: generate random number within a range
function random(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

// Generate metrics data
function generateMetrics() {
  const now = Date.now();
  return instances.map(i => {
    const point = {
      instanceId: i.id,
      name: i.name,
      region: i.region,
      ts: now,
      cpu: random(5, 90),
      mem: random(20, 95),
      netIn: random(0.1, 8.0),  // MB/s
      netOut: random(0.1, 8.0), // MB/s
      disk: random(10, 95)
    };

    // keep last 60 samples
    const arr = history[i.id];
    arr.push(point);
    if (arr.length > 60) arr.shift();

    return point;
  });
}

// Seed initial data
for (let j = 0; j < 10; j++) generateMetrics();

// ===============================
//  API Endpoints
// ===============================

// Get list of mock instances
app.get('/api/instances', (req, res) => {
  res.json({ instances });
});

// Get latest metrics snapshot
app.get('/api/metrics/latest', (req, res) => {
  const metrics = generateMetrics();
  res.json({ metrics });
});

// Get metric history for one instance
app.get('/api/metrics/history/:id', (req, res) => {
  const { id } = req.params;
  if (!history[id]) return res.status(404).json({ error: 'Unknown instance id' });
  res.json({ points: history[id] });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    status: '✅ CloudPulse backend running',
    endpoints: [
      '/api/instances',
      '/api/metrics/latest',
      '/api/metrics/history/:id'
    ]
  });
});

// ===============================
//  Start Server
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 CloudPulse backend listening on http://localhost:${PORT}`);
});
