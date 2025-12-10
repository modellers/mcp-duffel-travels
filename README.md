# MCP Duffel Travels

A Model Context Protocol (MCP) server that provides flight search and booking capabilities using the [Duffel API](https://duffel.com).

## Features

This MCP server implements the complete flight booking workflow with the following tools:

1. **flight_offer_request** - Search for flight offers based on origin, destination, dates, and passengers
2. **flight_offers** - Get detailed information about a specific flight offer
3. **flight_booking_validate_or_price_offer** - Validate an offer and confirm current pricing
4. **flight_booking_list_services_and_seatmaps** - View available services and seat maps
5. **flight_booking_create_order** - Create a booking order with passenger details
6. **flight_booking_pay_for_order** - Process payment for a held order
7. **flight_booking_get_order_status** - Retrieve order status and e-tickets

## Prerequisites

- Node.js 18 or higher
- A Duffel API key (get one at https://duffel.com)

## Installation

```bash
npm install
npm run build
```

## Configuration

Set your Duffel API key as an environment variable:

```bash
export DUFFEL_API_KEY=your_duffel_api_key_here
```

## Usage

### Running the Server

```bash
node build/index.js
```

### Using with Claude Desktop

Add the following to your Claude Desktop configuration file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "duffel-travels": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-duffel-travels/build/index.js"],
      "env": {
        "DUFFEL_API_KEY": "your_duffel_api_key_here"
      }
    }
  }
}
```

## Flight Booking Workflow

The typical flight booking flow follows these steps:

### 1. Search for Flights
Use `flight_offer_request` to search for available flights:
```json
{
  "origin": "JFK",
  "destination": "LAX",
  "departure_date": "2024-12-20",
  "return_date": "2024-12-27",
  "passengers": [
    { "type": "adult" }
  ],
  "cabin_class": "economy"
}
```

### 2. Get Offer Details
Use `flight_offers` to get detailed information about a specific offer:
```json
{
  "offer_id": "off_123abc..."
}
```

### 3. Validate Offer
Use `flight_booking_validate_or_price_offer` to confirm the current price:
```json
{
  "offer_id": "off_123abc..."
}
```

### 4. View Services and Seats (Optional)
Use `flight_booking_list_services_and_seatmaps` to see available add-ons:
```json
{
  "offer_id": "off_123abc..."
}
```

### 5. Create Order
Use `flight_booking_create_order` to reserve the flight:
```json
{
  "offer_id": "off_123abc...",
  "passengers": [
    {
      "id": "pas_0000...",
      "given_name": "John",
      "family_name": "Doe",
      "born_on": "1990-01-01",
      "email": "john.doe@example.com",
      "phone_number": "+1234567890"
    }
  ]
}
```

### 6. Pay for Order (if needed)
Use `flight_booking_pay_for_order` if the order is on hold:
```json
{
  "order_id": "ord_123abc...",
  "payment": {
    "type": "balance",
    "amount": "100.00",
    "currency": "USD"
  }
}
```

### 7. Check Order Status
Use `flight_booking_get_order_status` to retrieve tickets and confirmation:
```json
{
  "order_id": "ord_123abc..."
}
```

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

## API Documentation

For detailed information about the Duffel API, visit:
- [Duffel API Documentation](https://duffel.com/docs/api)
- [Duffel Node.js SDK](https://github.com/duffel/duffel-api-javascript)

## License

MIT
