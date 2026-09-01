#!/usr/bin/env node

/**
 * CamperRoster Standalone MCP Server (JSON-RPC 2.0 over Stdio)
 * Compatible with Claude Desktop, Cursor, ChatGPT, and Antigravity
 */

const readline = require("readline");

const TOOLS = [
  {
    name: "get_camp_sessions",
    description: "Retrieve available summer camp sessions, dates, age/grade ranges, pricing, and live capacity.",
    inputSchema: {
      type: "object",
      properties: { camp_slug: { type: "string" } }
    }
  },
  {
    name: "register_camper",
    description: "Register a camper for a summer session with guardian contact info and medical disclosures.",
    inputSchema: {
      type: "object",
      properties: {
        parent_name: { type: "string" },
        parent_email: { type: "string" },
        camper_name: { type: "string" },
        session_id: { type: "string" }
      },
      required: ["parent_name", "parent_email", "camper_name", "session_id"]
    }
  },
  {
    name: "get_camper_status",
    description: "Check the registration, medical clearance status, assigned cabin, and counselor for a camper.",
    inputSchema: {
      type: "object",
      properties: { camper_name: { type: "string" } },
      required: ["camper_name"]
    }
  },
  {
    name: "trigger_kaicalls_reference_check",
    description: "Initiate an automated KaiCalls Voice AI phone interview to check a volunteer or counselor reference.",
    inputSchema: {
      type: "object",
      properties: {
        applicant_name: { type: "string" },
        reference_name: { type: "string" },
        reference_phone: { type: "string" }
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
        camper_name: { type: "string" },
        sender_name: { type: "string" },
        message: { type: "string" }
      },
      required: ["camper_name", "sender_name", "message"]
    }
  }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on("line", async (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    const { id, method, params } = req;

    if (method === "tools/list" || method === "list_tools") {
      console.log(JSON.stringify({
        jsonrpc: "2.0",
        id,
        result: { tools: TOOLS }
      }));
      return;
    }

    if (method === "tools/call" || method === "call_tool") {
      const res = await fetch("https://camperroster.com/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req)
      });
      const data = await res.json();
      console.log(JSON.stringify(data));
      return;
    }

    console.log(JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: "Method not found" }
    }));
  } catch (err) {
    console.log(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32700, message: "Parse error: " + err.message }
    }));
  }
});
