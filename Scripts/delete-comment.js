import { getStore } from "@netlify/blobs";

export default async function handler(request, context) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { SITE_ID: siteID, NETLIFY_AUTH_TOKEN: token } = process.env;
  const headers = { "Content-Type": "application/json" };

  try {
    const { id, token: userToken } = await request.json();
    const commentsStore = getStore({ name: "site-comments", siteID, token });

    const existing = await commentsStore.get(id, { type: "json" });
    
    if (!existing) {
      return new Response(JSON.stringify({ error: "Comment not found" }), { status: 404, headers });
    }

    if (existing.token !== userToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers });
    }

    await commentsStore.delete(id);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}
