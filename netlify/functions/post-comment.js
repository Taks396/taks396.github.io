import { getStore } from "@netlify/blobs";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { id, token, name, message } = JSON.parse(event.body);
    const commentsStore = getStore("site-comments");

    // Check if comment already exists (is an edit)
    const existing = await commentsStore.get(id, { type: "json" });
    
    // Security verification: If it exists, tokens must match to execute the update
    if (existing && existing.token !== token) {
      return { statusCode: 403, body: "Unauthorized modification" };
    }

    // Save or completely overwrite the entry instantly
    await commentsStore.setJSON(id, {
      id,
      token,
      name,
      message,
      date: existing ? existing.date : new Date().toISOString()
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
