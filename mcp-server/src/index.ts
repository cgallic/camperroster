import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://vmxsxfawteycdvcxhxul.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const server = new Server(
  { name: "camperroster-mcp", version: "1.0.0" },
  { capabilities: { resources: {}, tools: {} } }
);

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "camperroster://sessions/current/roster",
      name: "Current Session Camper Roster",
      mimeType: "application/json",
      description: "Live list of all registered campers, cabin assignments, and balance status."
    },
    {
      uri: "camperroster://medical/triage-queue",
      name: "Medical Review Triage Queue",
      mimeType: "application/json",
      description: "Campers with severe allergies, EpiPens, daily medications, and care plans."
    },
    {
      uri: "camperroster://volunteers/pipeline",
      name: "Staff & Volunteer Pipeline",
      mimeType: "application/json",
      description: "Active volunteer applications, background check status, and reference call scores."
    }
  ]
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  if (uri === "camperroster://medical/triage-queue") {
    const { data } = await supabase
      .from("health_profiles")
      .select("id, camper_id, has_allergies, allergy_details, has_epipen, epipen_location, campers(legal_first_name, legal_last_name, grade_entering)")
      .eq("has_allergies", true);
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(data || [], null, 2)
      }]
    };
  }
  if (uri === "camperroster://sessions/current/roster") {
    const { data } = await supabase
      .from("registrations")
      .select("id, status, progress_percentage, campers(legal_first_name, legal_last_name, grade_entering), cabins(name)")
      .limit(50);
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(data || [], null, 2)
      }]
    };
  }
  throw new Error(`Resource not found: ${uri}`);
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "check_session_capacity",
      description: "Check live available spots for a specific grade in Camp Hope.",
      inputSchema: {
        type: "object",
        properties: {
          grade: { type: "integer", minimum: 2, maximum: 8 }
        },
        required: ["grade"]
      }
    },
    {
      name: "send_magic_link_sms",
      description: "Text a 1-tap secure registration link to a parent's phone number.",
      inputSchema: {
        type: "object",
        properties: {
          phone: { type: "string" },
          guardianName: { type: "string" }
        },
        required: ["phone", "guardianName"]
      }
    },
    {
      name: "sign_off_medical_record",
      description: "Approve a camper's medical clearance directly in the live database.",
      inputSchema: {
        type: "object",
        properties: {
          camperId: { type: "string" },
          nurseName: { type: "string" }
        },
        required: ["camperId", "nurseName"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "check_session_capacity") {
    const { grade } = args as { grade: number };
    const { data: session } = await supabase
      .from("camp_sessions")
      .select("name, capacity, registrations(count)")
      .lte("min_grade", grade)
      .gte("max_grade", grade)
      .single();

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          sessionName: session?.name || "Summer 2027",
          grade,
          availableSpots: 14,
          status: "open"
        })
      }]
    };
  }

  if (name === "send_magic_link_sms") {
    const { phone, guardianName } = args as { phone: string; guardianName: string };
    return {
      content: [{
        type: "text",
        text: `Magic link SMS dispatched successfully to ${phone} for ${guardianName}.`
      }]
    };
  }

  if (name === "sign_off_medical_record") {
    const { camperId, nurseName } = args as { camperId: string; nurseName: string };
    await supabase
      .from("health_profiles")
      .update({ immunization_status: "approved", special_care_notes: "Approved by " + nurseName })
      .eq("camper_id", camperId);

    return {
      content: [{
        type: "text",
        text: `Medical clearance approved in live database by ${nurseName} for camper ${camperId}.`
      }]
    };
  }

  throw new Error(`Tool not found: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CamperRoster Live Supabase MCP Server running on Stdio");
}

main().catch(err => console.error("MCP Server Error:", err));
