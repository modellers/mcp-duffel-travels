#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { Duffel } from "@duffel/api";

// Initialize Duffel client
const duffel = new Duffel({
  token: process.env.DUFFEL_API_KEY || "",
});

// Define the tools
const TOOLS: Tool[] = [
  {
    name: "flight_offer_request",
    description:
      "Search for flight offers based on origin, destination, departure date, and passenger details. Returns a list of available flight offers with offer_id that can be used in subsequent steps.",
    inputSchema: {
      type: "object",
      properties: {
        origin: {
          type: "string",
          description: "IATA airport code for origin (e.g., 'JFK', 'LHR')",
        },
        destination: {
          type: "string",
          description: "IATA airport code for destination (e.g., 'LAX', 'CDG')",
        },
        departure_date: {
          type: "string",
          description: "Departure date in ISO 8601 format (YYYY-MM-DD)",
        },
        return_date: {
          type: "string",
          description:
            "Return date in ISO 8601 format (YYYY-MM-DD). Optional for one-way flights.",
        },
        passengers: {
          type: "array",
          description: "Array of passenger details",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["adult", "child", "infant_without_seat"],
                description: "Type of passenger",
              },
            },
          },
        },
        cabin_class: {
          type: "string",
          enum: ["economy", "premium_economy", "business", "first"],
          description: "Cabin class preference (default: economy)",
        },
      },
      required: ["origin", "destination", "departure_date", "passengers"],
    },
  },
  {
    name: "flight_offers",
    description:
      "Get detailed information about a specific flight offer using its offer_id. This can be used after flight_offer_request to get more details about a particular offer.",
    inputSchema: {
      type: "object",
      properties: {
        offer_id: {
          type: "string",
          description: "The unique identifier of the flight offer",
        },
      },
      required: ["offer_id"],
    },
  },
  {
    name: "flight_booking_validate_or_price_offer",
    description:
      "Validate an offer and confirm its current price before booking. This ensures the offer is still available and the price hasn't changed since the initial search.",
    inputSchema: {
      type: "object",
      properties: {
        offer_id: {
          type: "string",
          description: "The unique identifier of the flight offer to validate",
        },
      },
      required: ["offer_id"],
    },
  },
  {
    name: "flight_booking_list_services_and_seatmaps",
    description:
      "Get available services (baggage, meals, etc.) and seat maps for a specific offer. Use this to select add-ons before creating an order.",
    inputSchema: {
      type: "object",
      properties: {
        offer_id: {
          type: "string",
          description: "The unique identifier of the flight offer",
        },
      },
      required: ["offer_id"],
    },
  },
  {
    name: "flight_booking_create_order",
    description:
      "Create a booking order with passenger details and payment information. Returns order_id and booking reference. This step reserves the flight before payment.",
    inputSchema: {
      type: "object",
      properties: {
        offer_id: {
          type: "string",
          description: "The unique identifier of the flight offer to book",
        },
        passengers: {
          type: "array",
          description: "Array of passenger details with full information",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Passenger identifier (matches offer request)",
              },
              title: {
                type: "string",
                enum: ["mr", "ms", "mrs", "miss", "dr"],
                description: "Passenger title",
              },
              given_name: {
                type: "string",
                description: "First name",
              },
              family_name: {
                type: "string",
                description: "Last name",
              },
              gender: {
                type: "string",
                enum: ["m", "f"],
                description: "Gender",
              },
              born_on: {
                type: "string",
                description: "Date of birth (YYYY-MM-DD)",
              },
              email: {
                type: "string",
                description: "Email address",
              },
              phone_number: {
                type: "string",
                description: "Phone number",
              },
            },
            required: [
              "id",
              "given_name",
              "family_name",
              "born_on",
              "email",
              "phone_number",
            ],
          },
        },
        payment: {
          type: "object",
          description: "Payment details",
          properties: {
            type: {
              type: "string",
              enum: ["balance", "arc_bsp_cash"],
              description: "Payment type",
            },
            amount: {
              type: "string",
              description: "Payment amount",
            },
            currency: {
              type: "string",
              description: "Currency code (e.g., 'USD', 'GBP')",
            },
          },
        },
        services: {
          type: "array",
          description: "Optional array of service IDs to add to the booking",
          items: {
            type: "string",
          },
        },
      },
      required: ["offer_id", "passengers"],
    },
  },
  {
    name: "flight_booking_pay_for_order",
    description:
      "Process payment for a held order. Use this after creating an order if payment was not included or if the order is on hold. Returns payment confirmation and e-tickets.",
    inputSchema: {
      type: "object",
      properties: {
        order_id: {
          type: "string",
          description: "The unique identifier of the order to pay for",
        },
        payment: {
          type: "object",
          description: "Payment details",
          properties: {
            type: {
              type: "string",
              enum: ["balance", "arc_bsp_cash"],
              description: "Payment type",
            },
            amount: {
              type: "string",
              description: "Payment amount",
            },
            currency: {
              type: "string",
              description: "Currency code (e.g., 'USD', 'GBP')",
            },
          },
          required: ["type", "amount", "currency"],
        },
      },
      required: ["order_id", "payment"],
    },
  },
  {
    name: "flight_booking_get_order_status",
    description:
      "Retrieve the current status of an order, including booking reference, tickets, and confirmation details. Use this to check order status and retrieve e-tickets.",
    inputSchema: {
      type: "object",
      properties: {
        order_id: {
          type: "string",
          description: "The unique identifier of the order",
        },
      },
      required: ["order_id"],
    },
  },
];

// Create server instance
const server = new Server(
  {
    name: "mcp-duffel-travels",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (!process.env.DUFFEL_API_KEY) {
      return {
        content: [
          {
            type: "text",
            text: "Error: DUFFEL_API_KEY environment variable is not set. Please set it before using this server.",
          },
        ],
      };
    }

    if (!args) {
      return {
        content: [
          {
            type: "text",
            text: "Error: Missing arguments for tool call.",
          },
        ],
        isError: true,
      };
    }

    switch (name) {
      case "flight_offer_request": {
        const {
          origin,
          destination,
          departure_date,
          return_date,
          passengers,
          cabin_class,
        } = args as any;

        // Build slices for the offer request
        const slices: any[] = [
          {
            origin,
            destination,
            departure_date,
          },
        ];

        // Add return slice if return_date is provided
        if (return_date) {
          slices.push({
            origin: destination,
            destination: origin,
            departure_date: return_date,
          });
        }

        const offerRequest = await duffel.offerRequests.create({
          slices,
          passengers: passengers as any,
          cabin_class: cabin_class || "economy",
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: offerRequest.data.id,
                  live_mode: offerRequest.data.live_mode,
                  offers_count: offerRequest.data.offers?.length || 0,
                  offers: offerRequest.data.offers?.slice(0, 10).map((offer: any) => ({
                    id: offer.id,
                    total_amount: offer.total_amount,
                    total_currency: offer.total_currency,
                    owner: offer.owner?.name,
                    slices: offer.slices?.map((slice: any) => ({
                      duration: slice.duration,
                      origin: slice.origin?.iata_code,
                      destination: slice.destination?.iata_code,
                      segments_count: slice.segments?.length,
                    })),
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "flight_offers": {
        const { offer_id } = args as any;
        const offer = await duffel.offers.get(offer_id);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(offer.data, null, 2),
            },
          ],
        };
      }

      case "flight_booking_validate_or_price_offer": {
        const { offer_id } = args as any;
        // Get the offer first
        const offer = await duffel.offers.get(offer_id);

        // Create an offer request to validate/price
        const validation = {
          offer_id: offer_id,
          expires_at: offer.data.expires_at,
          total_amount: offer.data.total_amount,
          total_currency: offer.data.total_currency,
          tax_amount: offer.data.tax_amount,
          tax_currency: offer.data.tax_currency,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(validation, null, 2),
            },
          ],
        };
      }

      case "flight_booking_list_services_and_seatmaps": {
        const { offer_id } = args as any;
        try {
          // Get seat maps (if available)
          let seatmaps: any = null;
          try {
            const seatmapResponse = await duffel.seatMaps.get({
              offer_id: offer_id,
            });
            seatmaps = seatmapResponse.data;
          } catch (error: any) {
            // Seat maps might not be available for all offers
            seatmaps = { message: "Seat maps not available for this offer" };
          }

          // Note: Services are typically part of the offer details
          // We'll return the seat maps and guide users to check the offer details for services
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    seatmaps: seatmaps,
                    note: "For available services (baggage, meals, etc.), please retrieve the full offer details using flight_offers tool. Services are included in the offer's available_services field.",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: error.message,
                    message: "Seat maps might not be available for this offer",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }

      case "flight_booking_create_order": {
        const { offer_id, passengers, payment, services } = args as any;
        const orderData: any = {
          selected_offers: [offer_id],
          passengers: passengers,
          type: "instant",
        };

        // Add payment if provided
        if (payment) {
          orderData.payments = [payment];
        }

        // Add services if provided
        if (services && Array.isArray(services) && services.length > 0) {
          orderData.services = services.map((serviceId: string) => ({
            id: serviceId,
          }));
        }

        const order = await duffel.orders.create(orderData);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: order.data.id,
                  booking_reference: order.data.booking_reference,
                  live_mode: order.data.live_mode,
                  total_amount: order.data.total_amount,
                  total_currency: order.data.total_currency,
                  created_at: order.data.created_at,
                  owner: order.data.owner,
                  passengers: order.data.passengers,
                  documents: order.data.documents,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "flight_booking_pay_for_order": {
        const { order_id, payment } = args as any;
        const paymentResponse = await duffel.payments.create({
          order_id: order_id,
          payment: payment as any,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(paymentResponse.data, null, 2),
            },
          ],
        };
      }

      case "flight_booking_get_order_status": {
        const { order_id } = args as any;
        const order = await duffel.orders.get(order_id);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: order.data.id,
                  booking_reference: order.data.booking_reference,
                  live_mode: order.data.live_mode,
                  total_amount: order.data.total_amount,
                  total_currency: order.data.total_currency,
                  created_at: order.data.created_at,
                  owner: order.data.owner,
                  passengers: order.data.passengers,
                  slices: order.data.slices,
                  documents: order.data.documents,
                  services: order.data.services,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}\n\nDetails: ${JSON.stringify(
            error.errors || error,
            null,
            2
          )}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Duffel MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
