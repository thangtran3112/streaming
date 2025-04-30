import express, { Request, Response } from 'express';
import { addClient, getLatestMessages, sendOrderMessage } from '../services/kafka';
import OrderModel from '../models/order.model';
import { Order } from '../models/order.types';

const router = express.Router();

// GET route for long polling Kafka messages
router.get('/messages', (req: Request, res: Response) => {
    console.log('Client connected for long polling');
    addClient(res);
});

// GET route to fetch all stored orders
router.get('/orders', async (req: Request, res: Response) => {
    try {
        const orders = await OrderModel.findAll();
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
});

// POST route to send test order messages to Kafka
router.post('/send/messages', async (req: Request, res: Response) => {
    try {
        const orderData: Omit<Order, 'id'> = req.body;

        // Validate the order data
        if (!orderData.customerId || !orderData.orderDate || !Array.isArray(orderData.items) ||
            !orderData.items.length || !orderData.totalAmount) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order data. Required fields: customerId, orderDate, items (array), totalAmount'
            });
        }

        // Set default status if not provided
        if (!orderData.status) {
            orderData.status = 'PENDING';
        }

        // Send the message to Kafka
        const result = await sendOrderMessage(orderData);

        if (result.success) {
            res.json({ success: true, orderId: result.id, message: 'Order sent successfully' });
        } else {
            res.status(500).json({ success: false, error: result.error || 'Failed to send order' });
        }
    } catch (error) {
        console.error('Error sending order message:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;