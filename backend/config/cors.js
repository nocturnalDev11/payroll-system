const corsOptions = {
    origin: 'https://payroll-system-frontend-pied.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-role'],
    credentials: true,
    optionsSuccessStatus: 200
};