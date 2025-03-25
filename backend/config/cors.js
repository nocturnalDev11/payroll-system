<<<<<<< HEAD
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:7777'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-role'],
    credentials: true,
    optionsSuccessStatus: 200
=======
export const corsOptions = {
    // origin: 'http://localhost:5174',
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
>>>>>>> 1f11dc9ba438c5cafca5d796ee1ee2768319b69a
};