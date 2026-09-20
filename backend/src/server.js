import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import stationsRouter from './routes/stations.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/stations', stationsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`LaGasolinera backend running on port ${PORT}`);
});
