import Fastify from 'fastify';
import websocketPlugin from '@fastify/websocket';
import { db } from './db.js'; 
import type { Mission, LiveTelemetry, MissionPlan } from './types.js'; 

const fastify = Fastify({ logger: true });
fastify.register(websocketPlugin);

// --- WebSocket Route ---
fastify.register(async function (server) {
  server.get('/ws/live', { websocket: true }, (connection, req) => {
    console.log('Client connected to live telemetry!');
    let currentBattery = 99.0;
    const missionStartTime = Date.now();

    connection.on('message', (message: any) => { /* ... */ });
    connection.on('close', () => {
      console.log('Client disconnected.');
      clearInterval(interval); 
    });

    const interval = setInterval(() => {
      const elapsedMilliseconds = Date.now() - missionStartTime;
      const totalSeconds = Math.floor(elapsedMilliseconds / 1000);
      const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
      const seconds = (totalSeconds % 60).toString().padStart(2, '0');
      const formattedFlightTime = `${minutes}:${seconds}`;
      currentBattery -= 0.01;

      const testTelemetry: LiveTelemetry = {
        gps: { lat: 14.531120 + (Math.random() - 0.5) * 0.001, lon: 121.057442 + (Math.random() - 0.5) * 0.001 },
        altitude: 47.9 + (Math.random() - 0.5) * 2,
        speed: 11.3 + (Math.random() - 0.5),
        roll: (Math.random() - 0.5) * 5,
        pitch: -5 + (Math.random() - 0.5) * 3,
        heading: 345 + (Math.random() - 0.5) * 5,
        signalStrength: -55,
        battery: { voltage: 16.8 * (currentBattery / 100), percentage: currentBattery < 0 ? 0 : currentBattery },
        satellites: 14,
        flightTime: formattedFlightTime,
        distanceFromHome: 4057 + totalSeconds,
        flightMode: 'Loiter',
        armed: true,
        verticalSpeed: -6.8 + (Math.random() - 0.5) * 0.2,
        breedingSiteDetected: false,
        currentBreedingSite: undefined,
        detectedSites: [],
        gpsTrack: [],
        modes: {
          angle: true,
          positionHold: true,
          returnToHome: false,
          altitudeHold: true,
          headingHold: false,
          airmode: true,
          surface: true,
          mcBraking: true,
          beeper: false,
        }
      };
      
      if (connection.readyState === 1) { // 1 means 'OPEN'
        connection.send(JSON.stringify(testTelemetry));
      } else {
        clearInterval(interval);
      }
    }, 1000); // Send data 1x per second
  });
});

// --- REST API Routes ---

// Root endpoint with API information
fastify.get('/', async (request, reply) => {
  return {
    name: 'GCS Backend API',
    version: '1.0.0',
    endpoints: {
      missions: {
        'GET /api/missions': 'Get all missions',
        'GET /api/missions/stats': 'Get mission statistics',
        'POST /api/missions': 'Create a new mission'
      },
      plans: {
        'GET /api/plans': 'Get all mission plans',
        'GET /api/plans/:id': 'Get a specific mission plan',
        'POST /api/plans': 'Create a new mission plan'
      },
      websocket: {
        'WS /ws/live': 'Live telemetry WebSocket'
      }
    }
  };
});

// GET all missions (for Flight Logs)
fastify.get('/api/missions', async (request, reply) => {
  try {
    const { rows } = await db.query('SELECT * FROM mission_logs ORDER BY id DESC');
    return rows;
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ error: 'Database error' });
  }
});

// GET dashboard stats
fastify.get('/api/missions/stats', async (request, reply) => {
  try {
    const countResult = await db.query('SELECT COUNT(*) AS total_flights FROM mission_logs');
    const durationResult = await db.query('SELECT duration FROM mission_logs');
    let totalSeconds = 0;
    for (const row of durationResult.rows) {
      const seconds = parseInt(row.duration, 10);
      if (!isNaN(seconds)) {
        totalSeconds += seconds;
      }
    }
    const hours = totalSeconds / 3600; 
    return {
      totalFlights: parseInt(countResult.rows[0].total_flights, 10),
      totalFlightTime: `${hours.toFixed(1)} Hours`
    };
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ error: 'Database error' });
  }
});

// POST a new mission (for Flight Logs)
fastify.post('/api/missions', async (request, reply) => {
  try {
    const mission = request.body as { duration: number } & Omit<Mission, 'id' | 'duration'>;
    const { name, date, duration, status, location, gpsTrack, detectedSites } = mission;
    const durationString = String(duration); 
    const { rows } = await db.query(
      'INSERT INTO mission_logs (name, date, duration, status, location, gps_track, detected_sites) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, date, durationString, status, location, JSON.stringify(gpsTrack), JSON.stringify(detectedSites)]
    );
    return rows[0];
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ error: 'Database error' });
  }
});


// ---
// NEW ROUTES FOR MISSION PLANNING
// ---

// POST a new MISSION PLAN (Save Plan)
fastify.post('/api/plans', async (request, reply) => {
  try {
    const plan = request.body as MissionPlan; 
    const { name, altitude, speed, waypoints } = plan;

    // Check for bad data
    if (!name || !waypoints || waypoints.length === 0) {
      return reply.code(400).send({ error: 'Invalid plan data. Name and waypoints are required.' });
    }

    const { rows } = await db.query(
      'INSERT INTO mission_plans (name, altitude, speed, waypoints) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, altitude, speed, JSON.stringify(waypoints)]
    );
    return rows[0]; 
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ error: 'Database error while saving plan' });
  }
});

// GET all saved mission plans (for Load Plan modal)
fastify.get('/api/plans', async (request, reply) => {
  try {
    // Only fetch id and name for the list view
    const { rows } = await db.query('SELECT id, name FROM mission_plans ORDER BY id DESC');
    return rows;
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ error: 'Database error while fetching plans' });
  }
});

// GET a *single* saved mission plan by its ID (when user clicks a plan)
fastify.get('/api/plans/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    
    const { rows } = await db.query(
      'SELECT * FROM mission_plans WHERE id = $1',
      [parseInt(id, 10)]
    );

    if (rows.length === 0) {
      return reply.code(404).send({ error: 'Plan not found' });
    }
    
    // Return the full plan details
    return rows[0]; 
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ error: 'Database error while fetching plan' });
  }
});


// --- Start Server ---
const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();