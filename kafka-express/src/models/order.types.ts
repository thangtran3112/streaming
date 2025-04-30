export interface OrderItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
}

export interface Order {
    id: string;
    customerId: string;
    orderDate: string;
    items: OrderItem[];
    totalAmount: number;
    status: string;
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';