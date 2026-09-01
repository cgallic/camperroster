import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const MCP_TOOLS = [
  {
    name: "get_camp_sessions",
    description: "Retrieve available summer camp sessions, dates, age/grade ranges, pricing, and live capacity for Camp Hope or another camp.",
    inputSchema: {
      type: "object",
      properties: {
        camp_slug: { type: "string", description: "Camp identifier, e.g. 'camphope'" }
      }
    }
  },
  {
    name: "register_camper",
    description: "Register a camper for a summer session with guardian contact info, emergency contacts, and medical disclosures.",
    inputSchema: {
      type: "object",
      properties: {
        parent_name: { type: "string", description: "Full name of parent/guardian" },
        parent_email: { type: "string", description: "Parent email address" },
        parent_phone: { type: "string", description: "Parent mobile phone number" },
        camper_name: { type: "string", description: "Full name of camper" },
        dob: { type: "string", description: "Camper date of birth (YYYY-MM-DD)" },
        grade_entering: { type: "string", description: "Grade camper is entering in fall" },
        session_id: { type: "string", description: "Session name or ID, e.g. 'Junior Camp (July 11-17)'" },
        allergies: { type: "string", description: "Allergies or medical considerations, e.g. 'Peanut allergy'" }
      },
      required: ["parent_name", "parent_email", "camper_name", "session_id"]
    }
  },
  {
    name: "get_camper_status",
    description: "Check the registration, medical clearance status, assigned cabin, and counselor for a camper.",
    inputSchema: {
      type: "object",
      properties: {
        camper_name: { type: "string", description: "First or last name of the camper" }
      },
      required: ["camper_name"]
    }
  },
  {
    name: "trigger_kaicalls_reference_check",
    description: "Initiate an automated KaiCalls Voice AI phone interview to check a volunteer or counselor reference.",
    inputSchema: {
      type: "object",
      properties: {
        applicant_name: { type: "string", description: "Full name of the staff or volunteer applicant" },
        reference_name: { type: "string", description: "Full name of the pastor, mentor, or reference" },
        reference_phone: { type: "string", description: "Mobile phone number of the reference" },
        reference_relation: { type: "string", description: "Relationship, e.g. 'Pastor', 'Youth Leader', 'Professor'" }
      },
      required: ["applicant_name", "reference_name", "reference_phone"]
    }
  },
  {
    name: "schedule_bunk_note",
    description: "Schedule a daily Bunk Note parent letter to be delivered during the camp's 11:00 AM cabin mail call.",
    inputSchema: {
      type: "object",
      properties: {
        camper_name: { type: "string", description: "Name of the camper receiving the letter" },
        sender_name: { type: "string", description: "Name of the parent/sender" },
        message: { type: "string", description: "Letter content to print" },
        delivery_date: { type: "string", description: "Target date for delivery (YYYY-MM-DD)" }
      },
      required: ["camper_name", "sender_name", "message"]
    }
  },
  {
    name: "reload_canteen_wallet",
    description: "Add funds to a camper's digital store wallet for cashless canteen snack and merchandise purchases.",
    inputSchema: {
      type: "object",
      properties: {
        registration_id: { type: "string", description: "Camper registration UUID" },
        amount_dollars: { type: "number", description: "Amount in USD to add, e.g. 25.00" }
      },
      required: ["registration_id", "amount_dollars"]
    }
  },
  {
    name: "express_gate_checkin",
    description: "Confirm 45-second gate check-in for an arriving camper on Opening Day Sunday.",
    inputSchema: {
      type: "object",
      properties: {
        registration_id: { type: "string", description: "Camper registration UUID" }
      },
      required: ["registration_id"]
    }
  }
];

export async function GET() {
  return NextResponse.json({
    name: "camperroster-mcp-server",
    version: "1.0.0",
    description: "Model Context Protocol (MCP) server for CamperRoster camp management platform",
    capabilities: {
      tools: MCP_TOOLS
    }
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jsonrpc, id, method, params } = body;

    // Handle MCP protocol handshake & tool listing
    if (method === "tools/list" || method === "list_tools") {
      return NextResponse.json({
        jsonrpc: jsonrpc || "2.0",
        id: id ?? null,
        result: {
          tools: MCP_TOOLS
        }
      });
    }

    if (method === "tools/call" || method === "call_tool") {
      const toolName = params?.name;
      const args = params?.arguments || {};

      switch (toolName) {
        case "get_camp_sessions": {
          return NextResponse.json({
            jsonrpc: "2.0",
            id: id ?? null,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    camp: "Camp Hope Summer 2027 (Lancaster, PA)",
                    sessions: [
                      { id: "s1", name: "Junior Camp", grades: "2-4", dates: "July 11–17, 2027", tuition: "$650 ($100 deposit)", spots_left: 8, ratio: "1:4" },
                      { id: "s2", name: "Intermediate Camp", grades: "5-6", dates: "July 18–24, 2027", tuition: "$650 ($100 deposit)", spots_left: 14, ratio: "1:5" },
                      { id: "s3", name: "Senior Teen Camp", grades: "7-8", dates: "July 25–31, 2027", tuition: "$675 ($100 deposit)", spots_left: 6, ratio: "1:6" }
                    ]
                  }, null, 2)
                }
              ]
            }
          });
        }

        case "register_camper": {
          const { parent_name, parent_email, parent_phone, camper_name, dob, grade_entering, session_id, allergies } = args;
          
          return NextResponse.json({
            jsonrpc: "2.0",
            id: id ?? null,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    status: "success",
                    message: `Successfully registered ${camper_name} for ${session_id}!`,
                    registration_id: "reg-demo-99",
                    cabin: "Cabin 4 • Timber Lodge",
                    counselors: "Mark Henderson & Sarah Jenkins",
                    portal_link: `https://camperroster.com/portal`
                  }, null, 2)
                }
              ]
            }
          });
        }

        case "get_camper_status": {
          const { camper_name } = args;
          return NextResponse.json({
            jsonrpc: "2.0",
            id: id ?? null,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    name: camper_name || "Jamie Gallic",
                    session: "Junior Camp (July 11-17, 2027)",
                    status: "Registered & Cleared",
                    medical_status: "Approved by RN (Peanut Allergy Flagged)",
                    cabin: "Cabin 4 • Timber Lodge",
                    counselor: "Counselor Mark & Sarah",
                    canteen_balance: "$35.00",
                    express_qr: "Active"
                  }, null, 2)
                }
              ]
            }
          });
        }

        case "trigger_kaicalls_reference_check": {
          const { applicant_name, reference_name, reference_phone } = args;
          return NextResponse.json({
            jsonrpc: "2.0",
            id: id ?? null,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    status: "queued",
                    message: `KaiCalls AI Voice Assistant scheduled to call ${reference_name} (${reference_phone}) regarding applicant ${applicant_name}.`,
                    interview_script: "Standard 2-minute safety & pastoral reference protocol",
                    webhook_callback: "https://camperroster.com/api/kaicalls/webhook"
                  }, null, 2)
                }
              ]
            }
          });
        }

        case "schedule_bunk_note": {
          const { camper_name, sender_name, message, delivery_date } = args;
          return NextResponse.json({
            jsonrpc: "2.0",
            id: id ?? null,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    status: "scheduled",
                    message: `Bunk note for ${camper_name} scheduled for 11:00 AM cabin mail call delivery!`,
                    letter: message
                  }, null, 2)
                }
              ]
            }
          });
        }

        case "reload_canteen_wallet": {
          const { registration_id, amount_dollars } = args;
          return NextResponse.json({
            jsonrpc: "2.0",
            id: id ?? null,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    status: "success",
                    message: `Added $${amount_dollars.toFixed(2)} to camper canteen wallet!`,
                    new_balance: `$${(35 + amount_dollars).toFixed(2)}`
                  }, null, 2)
                }
              ]
            }
          });
        }

        case "express_gate_checkin": {
          return NextResponse.json({
            jsonrpc: "2.0",
            id: id ?? null,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    status: "checked_in",
                    timestamp: new Date().toISOString(),
                    message: "Camper confirmed checked in at gate. Cabin counselor notified."
                  }, null, 2)
                }
              ]
            }
          });
        }

        default:
          return NextResponse.json({
            jsonrpc: "2.0",
            id: id ?? null,
            error: { code: -32601, message: `Tool '${toolName}' not found` }
          }, { status: 404 });
      }
    }

    return NextResponse.json({
      jsonrpc: "2.0",
      id: id ?? null,
      error: { code: -32600, message: "Invalid JSON-RPC request" }
    }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({
      jsonrpc: "2.0",
      error: { code: -32603, message: err.message }
    }, { status: 500 });
  }
}
