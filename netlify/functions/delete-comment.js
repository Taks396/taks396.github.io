import { getStore } from "@netlify/blobs";

export default async function handler(request, context) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { id, token } = await request.json();
    const commentsStore = getStore("site-comments");

    const existing = await commentsStore.get(id, { type: "json" });
    if (!existing) {
      return new Response(JSON.stringify({ error: "Comment not found" }), { status: 404 });
    }

    if (existing.token !== token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
    }

    await commentsStore.delete(id);

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
