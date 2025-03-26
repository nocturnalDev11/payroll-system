const corsOptions = {
    origin: ['https://payroll-system-lyart.vercel.app/', 'https://payroll-system-api-five.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-role'],
    credentials: true,
    optionsSuccessStatus: 200
};