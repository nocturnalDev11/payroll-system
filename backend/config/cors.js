const corsOptions = {
    // origin: ['http://localhost:5173', 'http://localhost:7777'],
    origin: ['http://localhost:7777', 'https://payroll-system-ten.vercel.app/'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-role'],
    credentials: true,
    optionsSuccessStatus: 200
};