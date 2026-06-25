import { getStore } from "@netlify/blobs";

export default async function handler(request, context) {
  const { SITE_ID: siteID, NETLIFY_AUTH_TOKEN: token } = process.env;

  try {
    const commentsStore = getStore({ name: "site-comments", siteID, token });
    
    const { blobs } = await commentsStore.list();
    const rawComments = await Promise.all(
      blobs.map(b => commentsStore.get(b.key, { type: "json" }).catch(() => null))
    );
    
    const comments = rawComments
      .filter(c => c && c.date)
      .map(({ token: _, ...publicData }) => publicData)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return new Response(JSON.stringify(comments), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate" 
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
