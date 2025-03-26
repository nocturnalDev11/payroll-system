const corsOptions = {
    origin: 'https://payroll-system-frontend-rjqk7ksx2-lutreze-hues-projects.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-role'],
    credentials: true,
    optionsSuccessStatus: 204
};

module.exports = corsOptions;