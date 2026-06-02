import { getStore } from "@netlify/blobs";

export default async function handler(request, context) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // Read the incoming payload via request.json() natively
    const { id, token, name, message } = await request.json();
    const commentsStore = getStore("site-comments");

    const existing = await commentsStore.get(id, { type: "json" });
    
    // Security check
    if (existing && existing.token !== token) {
      return new Response(JSON.stringify({ error: "Unauthorized modification" }), { 
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Save payload
    await commentsStore.setJSON(id, {
      id,
      token,
      name,
      message,
      date: existing ? existing.date : new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
