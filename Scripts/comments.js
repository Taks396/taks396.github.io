import { getStore } from "@netlify/blobs";

const { SITE_ID: siteID, NETLIFY_AUTH_TOKEN: token } = process.env;
const commentsStore = getStore({ name: "site-comments", siteID, token });
const headers = { "Content-Type": "application/json" };
const BLOB_KEY = "all-comments";

export default async function handler(request, context) {
  const method = request.method;

  try {
    // ==========================================
    // 1. GET ROUTE (Fetch all comments) - Only 1 Read!
    // ==========================================
    if (method === "GET") {
      const comments = await commentsStore.get(BLOB_KEY, { type: "json" }) || [];
      
      // Still strip private tokens before serving them to the client
      const publicComments = comments.map(({ token: _, ...publicData }) => publicData);

      return new Response(JSON.stringify(publicComments), {
        status: 200,
        headers: { ...headers, "Cache-Control": "no-cache, no-store, must-revalidate" }
      });
    }

    // ==========================================
    // 2. POST ROUTE (Add, Edit, and Delete) - Only 1 Read + 1 Write!
    // ==========================================
    if (method === "POST") {
      const { id, token: userToken, name, message, action } = await request.json();
      
      // Fetch the entire array of existing comments
      let comments = await commentsStore.get(BLOB_KEY, { type: "json" }) || [];
      const existingIdx = comments.findIndex(c => c.id === id);

      // --- ACTION A: DELETE ---
      if (action === "delete") {
        if (existingIdx === -1) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
        if (comments[existingIdx].token !== userToken) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers });
        
        // Remove the item in memory
        comments.splice(existingIdx, 1);
        await commentsStore.setJSON(BLOB_KEY, comments);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      // --- ACTION B: EDIT ---
      if (existingIdx !== -1) {
        if (comments[existingIdx].token !== userToken) {
          return new Response(JSON.stringify({ error: "Unauthorized modification" }), { status: 403, headers });
        }
        
        // Update the comment in memory, safely tracking payload size and keeping original date
        comments[existingIdx] = {
          id,
          token: userToken,
          name: (name || 'Anonymous').trim().slice(0, 100),
          message: (message || '').trim().slice(0, 2000),
          date: comments[existingIdx].date
        };
      } 
      // --- ACTION C: ADD NEW ---
      else {
        comments.unshift({
          id,
          token: userToken,
          name: (name || 'Anonymous').trim().slice(0, 100),
          message: (message || '').trim().slice(0, 2000),
          date: new Date().toISOString()
        });
      }

      // Re-sort to guarantee chronological order before saving
      comments.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Overwrite the single blob with the updated array
      await commentsStore.setJSON(BLOB_KEY, comments);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response("Method Not Allowed", { status: 405 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}
