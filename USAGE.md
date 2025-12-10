# Duffel API MCP Server - Usage Guide

This guide provides detailed examples of using the Duffel MCP Server for flight booking operations.

## Complete Booking Workflow Example

Here's a step-by-step example of the complete flight booking process:

### Step 1: Search for Flight Offers

Search for available flights from New York (JFK) to Los Angeles (LAX):

```json
Tool: flight_offer_request
{
  "origin": "JFK",
  "destination": "LAX",
  "departure_date": "2024-12-20",
  "return_date": "2024-12-27",
  "passengers": [
    { "type": "adult" },
    { "type": "adult" }
  ],
  "cabin_class": "economy"
}
```

**Response:** Returns a list of available offers with offer IDs, prices, and basic flight information.

### Step 2: Get Detailed Offer Information

Get full details about a specific offer:

```json
Tool: flight_offers
{
  "offer_id": "off_00009htYpSCXrwaB9Dn123"
}
```

**Response:** Returns complete offer details including:
- Flight segments
- Airlines
- Aircraft types
- Baggage allowances
- Fare conditions
- Available services

### Step 3: Validate Offer Price

Confirm the offer is still valid and at the current price:

```json
Tool: flight_booking_validate_or_price_offer
{
  "offer_id": "off_00009htYpSCXrwaB9Dn123"
}
```

**Response:** Returns current pricing and expiration time.

### Step 4: View Available Services and Seat Maps

Check available add-ons and seat selections:

```json
Tool: flight_booking_list_services_and_seatmaps
{
  "offer_id": "off_00009htYpSCXrwaB9Dn123"
}
```

**Response:** Returns seat maps and notes about available services in the offer.

### Step 5: Create Booking Order

Create the booking with passenger details:

```json
Tool: flight_booking_create_order
{
  "offer_id": "off_00009htYpSCXrwaB9Dn123",
  "passengers": [
    {
      "id": "pas_0000AUq6F7yHMjAeJGzMb0",
      "title": "mr",
      "given_name": "John",
      "family_name": "Smith",
      "gender": "m",
      "born_on": "1990-01-15",
      "email": "john.smith@example.com",
      "phone_number": "+15551234567"
    },
    {
      "id": "pas_0000AUq6F7yHMjAeJGzMb1",
      "title": "mrs",
      "given_name": "Jane",
      "family_name": "Smith",
      "gender": "f",
      "born_on": "1992-03-20",
      "email": "jane.smith@example.com",
      "phone_number": "+15551234567"
    }
  ],
  "payment": {
    "type": "balance",
    "amount": "450.00",
    "currency": "USD"
  }
}
```

**Response:** Returns:
- Order ID
- Booking reference
- Order status
- Passenger details
- Documents (if issued immediately)

### Step 6: Pay for Order (if held)

If the order was created without immediate payment:

```json
Tool: flight_booking_pay_for_order
{
  "order_id": "ord_0000AUHKwLFyD7aPWcZnKQ",
  "payment": {
    "type": "balance",
    "amount": "450.00",
    "currency": "USD"
  }
}
```

**Response:** Payment confirmation and updated order status.

### Step 7: Check Order Status and Retrieve Tickets

Get the final order status and e-tickets:

```json
Tool: flight_booking_get_order_status
{
  "order_id": "ord_0000AUHKwLFyD7aPWcZnKQ"
}
```

**Response:** Returns:
- Complete order details
- Booking reference
- All passenger tickets
- E-ticket numbers
- Flight details

## One-Way Flight Example

For a one-way flight, simply omit the `return_date`:

```json
Tool: flight_offer_request
{
  "origin": "LHR",
  "destination": "JFK",
  "departure_date": "2024-12-15",
  "passengers": [
    { "type": "adult" }
  ],
  "cabin_class": "business"
}
```

## Family Travel Example

Booking for a family with children:

```json
Tool: flight_offer_request
{
  "origin": "CDG",
  "destination": "BCN",
  "departure_date": "2024-12-20",
  "return_date": "2024-12-27",
  "passengers": [
    { "type": "adult" },
    { "type": "adult" },
    { "type": "child" },
    { "type": "infant_without_seat" }
  ],
  "cabin_class": "economy"
}
```

## Tips and Best Practices

1. **Always validate offers** before creating an order - prices can change quickly
2. **Check expiration times** - offers typically expire within 5-20 minutes
3. **Provide accurate passenger information** - it must match travel documents
4. **Test with sandbox/test API keys** before using production
5. **Store order IDs** - you'll need them to check status and retrieve tickets
6. **Handle errors gracefully** - API calls can fail for various reasons

## Common Cabin Classes

- `economy` - Economy class
- `premium_economy` - Premium economy
- `business` - Business class
- `first` - First class

## Passenger Types

- `adult` - Passenger 16+ years old
- `child` - Passenger 2-15 years old
- `infant_without_seat` - Passenger under 2 years old (on lap)

## Error Handling

The server returns detailed error messages when operations fail. Common errors include:

- **Invalid API key** - Check your DUFFEL_API_KEY environment variable
- **Offer expired** - Search for new offers
- **Invalid passenger data** - Verify all required fields are provided
- **Payment failed** - Check payment details and account balance

## Testing

When testing, use Duffel's test API keys (starting with `duffel_test_`). Test bookings won't result in actual flights being booked.

## Support

For issues with the MCP server, check the GitHub repository.
For Duffel API questions, visit: https://duffel.com/docs
