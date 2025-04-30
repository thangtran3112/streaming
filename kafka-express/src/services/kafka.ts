import { Kafka, Producer, Consumer } from 'kafkajs';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import OrderModel from '../models/order.model';
import { Order } from '../models/order.types';
import dotenv from 'dotenv';

dotenv.config();

// Configure Kafka client
const kafka = new Kafka({
    clientId: 'express-kafka-client',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

// Configure Schema Registry
const registry = new SchemaRegistry({
    host: process.env.SCHEMA_REGISTRY_URL || 'http://localhost:8081',
});

// Topic name
const TOPIC = 'orders';

// Consumer and producer instances
const consumer: Consumer = kafka.consumer({ groupId: 'order-consumer-group' });
let producer: Producer;

// Store for connected clients
interface LongPollingClient {
    res: Response;
    clientId: number;
    complete: boolean;
}

let connectedClients: LongPollingClient[] = [];
let latestMessages: Order[] = [];
const MAX_STORED_MESSAGES = 100;

// Initialize Schema Registry with our Order schema
let orderSchemaId: number;

export const initializeKafka = async (): Promise<void> => {
    try {
        // Register the schema
        const orderSchema = JSON.parse(
            fs.readFileSync(path.join(__dirname, '../schemas/order.schema.json'), 'utf-8')
        );

        try {
            orderSchemaId = await registry.register(orderSchema);
            console.log(`Schema registered with ID: ${orderSchemaId}`);
        } catch (schemaError) {
            console.log('Schema might be already registered, trying to get its ID');
            const schemas = await registry.getLatestSchemaId('com.ecommerce.Order');
            orderSchemaId = schemas;
        }

        // Initialize producer
        producer = kafka.producer();
        await producer.connect();
        console.log('Kafka producer connected');

        // Initialize consumer
        await consumer.connect();
        await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
        console.log('Kafka consumer connected and subscribed to topic:', TOPIC);

        // Start consuming messages
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    if (!message.value) return;

                    // Decode the message using Schema Registry
                    const decodedMessage = await registry.decode(message.value) as Order;
                    console.log(`Received message: ${JSON.stringify(decodedMessage)}`);

                    // Store the message for long polling clients
                    latestMessages.push(decodedMessage);
                    if (latestMessages.length > MAX_STORED_MESSAGES) {
                        latestMessages.shift();
                    }

                    // Save order to database
                    try {
                        await OrderModel.create({
                            id: decodedMessage.id,
                            customerId: decodedMessage.customerId,
                            orderDate: decodedMessage.orderDate,
                            totalAmount: decodedMessage.totalAmount,
                            status: decodedMessage.status,
                            items: decodedMessage.items
                        });
                        console.log(`Order ${decodedMessage.id} saved to database`);
                    } catch (dbError) {
                        console.error('Error saving order to database:', dbError);
                    }

                    // Notify all connected clients
                    notifyClients(decodedMessage);
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            },
        });
    } catch (error) {
        console.error('Failed to initialize Kafka services:', error);
        // Retry after some time
        setTimeout(initializeKafka, 5000);
    }
};

// Notify all connected clients about a new message
const notifyClients = (message: Order): void => {
    connectedClients.forEach(client => {
        client.res.json({ success: true, message });
        client.complete = true;
    });

    // Remove completed clients
    connectedClients = connectedClients.filter(client => !client.complete);
};

// Add a client to the long polling queue
export const addClient = (res: Response): void => {
    const clientId = Date.now();

    const client: LongPollingClient = {
        res,
        clientId,
        complete: false
    };

    res.setTimeout(30000, () => {
        // If no messages received in 30 seconds, return empty response
        if (!client.complete) {
            res.json({ success: true, message: null });
            client.complete = true;
            // Clean up this client
            connectedClients = connectedClients.filter(c => c.clientId !== clientId);
        }
    });

    // Handle client disconnection
    res.on('close', () => {
        connectedClients = connectedClients.filter(c => c.clientId !== clientId);
    });

    connectedClients.push(client);
};

// Get latest messages
export const getLatestMessages = (): Order[] => {
    return latestMessages;
};

// Send a message to Kafka
export const sendOrderMessage = async (orderData: Omit<Order, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
        // Generate a unique ID for the order
        const id = uuidv4();
        const order: Order = {
            ...orderData,
            id
        };

        // Encode message with the registered schema
        const encodedOrder = await registry.encode(orderSchemaId, order);

        // Send the message to Kafka
        await producer.send({
            topic: TOPIC,
            messages: [
                {
                    key: id,
                    value: encodedOrder
                }
            ],
        });

        return { success: true, id };
    } catch (error) {
        console.error('Error sending message to Kafka:', error);
        return { success: false, error: (error as Error).message };
    }
};