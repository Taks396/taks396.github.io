import { getStore } from "@netlify/blobs";

const { SITE_ID: siteID, NETLIFY_AUTH_TOKEN: token } = process.env;
const commentsStore = getStore({ name: "site-comments", siteID, token });
const headers = { "Content-Type": "application/json" };
const BLOB_KEY = "all-comments";

// Helper function to handle standard JSON HTTP responses cleanly
const send = (body, status = 200, extraHeaders = {}) => 
  new Response(JSON.stringify(body), { status, headers: { ...headers, ...extraHeaders } });

export default async function handler(request) {
  const { method } = request;
  if (method !== "GET" && method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  try {
    let comments = await commentsStore.get(BLOB_KEY, { type: "json" }) || [];

    // ==========================================
    // 1. GET ROUTE (Fetch and display comments)
    // ==========================================
    if (method === "GET") {
      const publicComments = comments.map(({ token: _, ...publicData }) => publicData);
      return send(publicComments, 200, { "Cache-Control": "no-cache, no-store, must-revalidate" });
    }

    // ==========================================
    // 2. POST ROUTE (Post, Edit, and Delete)
    // ==========================================
    const { id, token: userToken, name, message, action, sourcePage } = await request.json();
    const existingIdx = comments.findIndex(c => c.id === id);
    const existing = comments[existingIdx];

    // Auth Validation Guard
    if (existing && existing.token !== userToken) return send({ error: "Unauthorized" }, 403);

    if (action === "delete") {
      if (!existing) return send({ error: "Not found" }, 404);
      comments.splice(existingIdx, 1);
    } else {
      const payload = {
        id,
        token: userToken,
        name: (name || 'Anonymous').trim().slice(0, 100),
        message: (message || '').trim().slice(0, 2000),
        sourcePage: existing ? existing.sourcePage : (sourcePage || 'General').trim().slice(0, 50),
        date: existing ? existing.date : new Date().toISOString()
      };
      existing ? (comments[existingIdx] = payload) : comments.unshift(payload);
    }

    comments.sort((a, b) => new Date(b.date) - new Date(a.date));
    await commentsStore.setJSON(BLOB_KEY, comments);
    return send({ success: true });

  } catch (error) {
    return send({ error: error.message }, 500);
  }
}
