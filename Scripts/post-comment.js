import { getStore } from "@netlify/blobs";

export default async function handler(request, context) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { SITE_ID: siteID, NETLIFY_AUTH_TOKEN: token } = process.env;
  const headers = { "Content-Type": "application/json" };

  try {
    const { id, token: userToken, name, message } = await request.json();
    const commentsStore = getStore({ name: "site-comments", siteID, token });

    const existing = await commentsStore.get(id, { type: "json" });
    
    // Security check
    if (existing && existing.token !== userToken) {
      return new Response(JSON.stringify({ error: "Unauthorized modification" }), { status: 403, headers });
    }

    // Save payload with compressed conditional evaluation
    await commentsStore.setJSON(id, {
      id,
      token: userToken,
      name,
      message,
      date: existing?.date || new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}
