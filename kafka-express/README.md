# Kafka Express Backend

A TypeScript Express backend that demonstrates long polling to consume Kafka messages with Schema Registry support. The application persists e-commerce Order data in a PostgreSQL database.

## Features

- Express backend with TypeScript
- Long polling mechanism to consume Kafka messages
- Schema Registry integration using Avro schemas
- PostgreSQL database storage
- Docker Compose setup for all services

## Prerequisites

- Docker and Docker Compose
- Node.js (for local development)

## Getting Started

### Running with Docker Compose

1. Start all services (Kafka, Zookeeper, Schema Registry, PostgreSQL, and Express backend):

```bash
docker-compose up -d
```

2. To see logs from the Express application:

```bash
docker-compose logs -f express-kafka
```

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Make sure Kafka, Zookeeper, Schema Registry and PostgreSQL are running:

```bash
docker-compose up -d zookeeper kafka schema-registry postgres
```

3. Start the Express application in development mode:

```bash
npm run dev
```

## API Endpoints

### Long Polling to Receive Orders

```
GET /api/messages
```

This endpoint uses long polling to receive Order messages from Kafka. The connection will be held open for up to 30 seconds until a new message arrives or the timeout is reached.

### Send Test Order Messages

```
POST /api/send/messages
```

Send a test Order message to Kafka. Example request body:

```json
{
  "customerId": "cust-123",
  "orderDate": "2023-11-01T10:30:00Z",
  "items": [
    {
      "productId": "prod-1",
      "name": "Laptop",
      "quantity": 1,
      "price": 1299.99
    },
    {
      "productId": "prod-2",
      "name": "Mouse",
      "quantity": 1,
      "price": 49.99
    }
  ],
  "totalAmount": 1349.98,
  "status": "PENDING"
}
```

### Get All Orders

```
GET /api/orders
```

Retrieves all Orders stored in the PostgreSQL database.

## Environment Variables

The following environment variables can be configured:

- `PORT`: Application port (default: 3000)
- `KAFKA_BROKER`: Kafka broker address (default: localhost:9092)
- `SCHEMA_REGISTRY_URL`: Schema Registry URL (default: http://localhost:8081)
- `POSTGRES_HOST`: PostgreSQL host (default: localhost)
- `POSTGRES_PORT`: PostgreSQL port (default: 5432)
- `POSTGRES_DB`: PostgreSQL database name (default: orders)
- `POSTGRES_USER`: PostgreSQL username (default: stackline)
- `POSTGRES_PASSWORD`: PostgreSQL password (default: stackline)

## Project Structure

```
├── src/
│   ├── models/
│   │   ├── order.model.ts    # Sequelize model
│   │   └── order.types.ts    # TypeScript interfaces
│   ├── routes/
│   │   └── orderRoutes.ts    # Express routes
│   ├── schemas/
│   │   └── order.schema.json # Avro schema
│   ├── services/
│   │   ├── database.ts       # Database connection
│   │   └── kafka.ts          # Kafka services
│   ├── server.ts             # Main Express application
│   └── .env                  # Environment variables
├── docker-compose.yml        # Docker Compose configuration
├── Dockerfile                # Docker configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```
