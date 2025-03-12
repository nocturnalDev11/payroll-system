export const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5000'], // Add both frontend and backend origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Added PATCH as it's used in some routes
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Enable credentials for authenticated requests
    optionsSuccessStatus: 200 // For legacy browser support
};