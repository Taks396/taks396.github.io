import { getStore } from "@netlify/blobs";

// RUNTIME OPTIMIZATION: Initialize the store ONCE at the file's top level.
// This connection stays warm in memory across subsequent HTTP execution context runs.
const { SITE_ID: siteID, NETLIFY_AUTH_TOKEN: token } = process.env;
const commentsStore = getStore({ name: "site-comments", siteID, token });
const headers = { "Content-Type": "application/json" };

export default async function handler(request, context) {
  const method = request.method;

  try {
    // ==========================================
    // 1. GET ROUTE (Fetch and display comments)
    // ==========================================
    if (method === "GET") {
      const { blobs } = await commentsStore.list();
      
      // Concurrently resolve JSON blobs; safely catch individual corrupted keys
      const rawComments = await Promise.all(
        blobs.map(b => commentsStore.get(b.key, { type: "json" }).catch(() => null))
      );
      
      const comments = rawComments
        .filter(c => c?.date)
        .map(({ token: _, ...publicData }) => publicData) // Strip private user tokens
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return new Response(JSON.stringify(comments), {
        status: 200,
        headers: { ...headers, "Cache-Control": "no-cache, no-store, must-revalidate" }
      });
    }

    // ==========================================
    // 2. POST ROUTE (Post, Edit, and Delete)
    // ==========================================
    if (method === "POST") {
      const { id, token: userToken, name, message, action } = await request.json();

      // OPTIMIZATION: Route internal deletions via an active payload action flag
      if (action === "delete") {
        const existing = await commentsStore.get(id, { type: "json" });
        if (!existing) return new Response(JSON.stringify({ error: "Comment not found" }), { status: 404, headers });
        if (existing.token !== userToken) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers });
        
        await commentsStore.delete(id);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      // Handle standard Post / Update modifications
      const existing = await commentsStore.get(id, { type: "json" });
      if (existing && existing.token !== userToken) {
        return new Response(JSON.stringify({ error: "Unauthorized modification" }), { status: 403, headers });
      }

      await commentsStore.setJSON(id, {
        id,
        token: userToken,
        name,
        message,
        date: existing?.date || new Date().toISOString()
      });

      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response("Method Not Allowed", { status: 405 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}
