import { getStore } from "@netlify/blobs";

export default async function handler(request, context) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const siteID = process.env.SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  try {
    const { id, token: userToken, name, message } = await request.json();
    
    // FIX: Pass site credentials into store configuration
    const commentsStore = getStore({
      name: "site-comments",
      siteID: siteID,
      token: token
    });

    const existing = await commentsStore.get(id, { type: "json" });
    
    // Security check
    if (existing && existing.token !== userToken) {
      return new Response(JSON.stringify({ error: "Unauthorized modification" }), { 
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Save payload
    await commentsStore.setJSON(id, {
      id,
      token: userToken,
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
