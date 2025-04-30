import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(
    process.env.POSTGRES_DB || 'orders',
    process.env.POSTGRES_USER || 'stackline',
    process.env.POSTGRES_PASSWORD || 'stackline',
    {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        dialect: 'postgres',
        logging: false,
    }
);

export const initializeDatabase = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully');
        await sequelize.sync({ alter: true });
        console.log('Database synchronized successfully');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};