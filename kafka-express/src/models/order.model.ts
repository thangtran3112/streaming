import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../services/database';
import { Order, OrderItem } from './order.types';

interface OrderAttributes extends Order {
    createdAt?: Date;
    updatedAt?: Date;
}

export interface OrderInput extends Optional<OrderAttributes, 'id'> { }
export interface OrderOutput extends Required<OrderAttributes> { }

class OrderModel extends Model<OrderAttributes, OrderInput> implements OrderAttributes {
    public id!: string;
    public customerId!: string;
    public orderDate!: string;
    public items!: OrderItem[];
    public totalAmount!: number;
    public status!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

OrderModel.init(
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        customerId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        orderDate: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        items: {
            type: DataTypes.JSONB,
            allowNull: false,
        },
        totalAmount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'PENDING',
        },
    },
    {
        sequelize,
        tableName: 'orders',
        modelName: 'Order',
    }
);

export default OrderModel;