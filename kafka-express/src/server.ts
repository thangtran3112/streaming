import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { initializeDatabase } from './services/database';
import { initializeKafka } from './services/kafka';
import orderRoutes from './routes/orderRoutes';

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api', orderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const startServer = async () => {
    try {
        // Initialize database connection
        await initializeDatabase();

        // Initialize Kafka services
        await initializeKafka();

        // Start Express server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Long polling endpoint: http://localhost:${PORT}/api/messages`);
            console.log(`Send test messages endpoint: http://localhost:${PORT}/api/send/messages`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();