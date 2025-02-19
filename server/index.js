import express from 'express'
import path from 'path'
import cors from 'cors'
import { corsOptions } from './config/cors.js'
import connectDb from './config/db.js'
import adminRoutes from './routes/adminRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';

const PORT = process.env.PORT || 3001;

const app = express();

connectDb();

// Middleware for parsing JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors(corsOptions));

app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use(express.static('public'));

// GET Route for homepage
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '/public/index.html'))
);

app.listen(PORT, () =>
  console.log(`Server listening on port ${PORT}`)
);
