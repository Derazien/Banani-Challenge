import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received request body:", body);
    
    if (!body || typeof body !== 'object') {
      console.error("Invalid request body format");
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    const { prompt, existingTable } = body;
    
    if (!prompt || typeof prompt !== 'string') {
      console.error("Invalid or missing prompt:", prompt);
      return NextResponse.json({ error: "Valid prompt string is required" }, { status: 400 });
    }

    if (prompt.trim().length === 0) {
      console.error("Empty prompt provided");
      return NextResponse.json({ error: "Prompt cannot be empty" }, { status: 400 });
    }

    // Check if this is a table edit request
    const isEditMode = existingTable !== undefined;
    console.log(`Sending ${isEditMode ? 'edit' : 'create'} request to backend with prompt:`, prompt);
    if (isEditMode) {
      console.log("Including existing table:", existingTable.title);
    }
    
    // Prepare the request body - include existingTable only if it's provided
    const requestBody = isEditMode 
      ? { prompt, existingTable } 
      : { prompt };
    
    const backendRes = await fetch("http://localhost:3001/api/table/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      console.error("Backend error response:", {
        status: backendRes.status,
        statusText: backendRes.statusText,
        body: errorText,
        headers: Object.fromEntries(backendRes.headers.entries())
      });
      return NextResponse.json({ 
        error: "Backend service error", 
        details: {
          status: backendRes.status,
          statusText: backendRes.statusText,
          message: errorText
        }
      }, { status: backendRes.status });
    }

    const backendData = await backendRes.json();
    console.log("Backend response received:", backendData);

    // Validate backend response structure
    if (!backendData || typeof backendData !== 'object') {
      console.error("Invalid backend response format:", backendData);
      return NextResponse.json({ error: "Invalid response from backend service" }, { status: 502 });
    }

    // Return the backend response directly since it already matches our frontend format
    return NextResponse.json(backendData);
  } catch (err: any) {
    console.error("Error in generate-table API:", {
      message: err.message,
      stack: err.stack,
      cause: err.cause,
      name: err.name
    });
    return NextResponse.json({ 
      error: "Internal server error",
      details: {
        message: err.message,
        type: err.name,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
} 