import { getStore } from "@netlify/blobs";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { id, token } = JSON.parse(event.body);
    const commentsStore = getStore("site-comments");

    const existing = await commentsStore.get(id, { type: "json" });
    if (!existing) return { statusCode: 404, body: "Comment not found" };

    // Verify ownership token validation
    if (existing.token !== token) return { statusCode: 403, body: "Unauthorized" };

    // Wipe object key out of storage entirely
    await commentsStore.delete(id);

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
