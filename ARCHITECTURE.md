# Duffel Flight Booking MCP Server

## Goal
Node.js MCP server for flight booking operations using Duffel API.

## What It Does
Provides real-time flight inventory search, pricing validation, and booking transactions with airlines.

## External API
- **Duffel API** (`api.duffel.com`) - Direct airline inventory and booking platform

## MCP Tools (7 total)

### Search & Pricing
- `flight_create_offer_request` - Search bookable flight offers with live airline pricing
- `flight_list_offers` - Retrieve paginated offers with sorting

### Pre-Booking
- `flight_booking_validate_or_price_offer` - Validate offer still available at quoted price
- `flight_booking_list_services_and_seatmaps` - Get seat maps, baggage, meals, ancillaries

### Booking & Payment
- `flight_booking_create_order` - Create airline reservation (instant or hold)
- `flight_booking_pay_for_order` - Complete payment for hold reservations
- `flight_booking_get_order_status` - Check order status and retrieve e-tickets

## Information Flow
1. Search offers → Get offer_id
2. Validate offer → Confirm current price
3. Get services/seats → Select add-ons
4. Create order → Get order_id and booking reference
5. Pay (if hold) → Receive e-tickets
6. Check status → Retrieve tickets/confirmation

## API Endpoints Used

### POST `/air/offer_requests`
Create flight search - returns bookable offers with IDs

### GET `/air/offers`
List/paginate offers by offer_request_id

### GET `/air/offers/{offer_id}`
Validate single offer current pricing

### GET `/air/seat_maps?offer_id={id}`
Get seat maps for offer

### GET `/air/offer_services?offer_id={id}`
Get available ancillary services

### POST `/air/orders`
Create booking order

### POST `/air/payments`
Process payment for order

### GET `/air/orders/{order_id}`
Get order status and documents

## How to Start

### 1. Install
```bash
npm install @modelcontextprotocol/sdk dotenv
```

### 2. Environment Variables
```bash
DUFFEL_TOKEN=your_duffel_api_token
```

### 3. Create Server (src/duffel-mcp.js)
```javascript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";

dotenv.config();

const DUFFEL_BASE = "https://api.duffel.com";
const DUFFEL_TOKEN = process.env.DUFFEL_TOKEN;

const server = new Server(
  { name: "duffel-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "duffel_create_offer_request",
      description: "Search bookable flight offers",
      inputSchema: {
        type: "object",
        properties: {
          origin: { type: "string" },
          destination: { type: "string" },
          departure_date: { type: "string" },
          return_date: { type: "string" },
          cabin_class: { type: "string", default: "economy" },
          adults: { type: "number", default: 1 },
        },
        required: ["origin", "destination", "departure_date"],
      },
    },
    // ... other 6 tools
  ],
}));

// Execute tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "duffel_create_offer_request") {
    const slices = [{ origin: args.origin, destination: args.destination, departure_date: args.departure_date }];
    if (args.return_date) {
      slices.push({ origin: args.destination, destination: args.origin, departure_date: args.return_date });
    }

    const response = await fetch(`${DUFFEL_BASE}/air/offer_requests?return_offers=true`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DUFFEL_TOKEN}`,
        "Duffel-Version": "v2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          slices,
          passengers: [{ type: "adult" }],
          cabin_class: args.cabin_class || "economy",
        },
      }),
    });

    const data = await response.json();
    return {
      content: [{ type: "text", text: JSON.stringify(data.data, null, 2) }],
    };
  }

  // Handle other tools...
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 4. Run
```bash
node src/duffel-mcp.js
```

### 5. Configure Claude Desktop
```json
{
  "mcpServers": {
    "duffel": {
      "command": "node",
      "args": ["/path/to/src/duffel-mcp.js"],
      "env": {
        "DUFFEL_TOKEN": "your_token"
      }
    }
  }
}
```

## Key Implementation Details

### Authentication
All requests need:
```javascript
headers: {
  "Authorization": `Bearer ${DUFFEL_TOKEN}`,
  "Duffel-Version": "v2",
  "Content-Type": "application/json"
}
```

### Request Payload Structure
POST requests wrap data in `{ data: {...} }`:
```javascript
body: JSON.stringify({ data: { slices, passengers, cabin_class } })
```

### Response Structure
Duffel wraps responses in `{ data: {...} }` - extract with `response.data`
