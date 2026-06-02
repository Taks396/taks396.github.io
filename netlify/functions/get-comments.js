import { getStore } from "@netlify/blobs";

export default async function handler(request, context) {
  const siteID = process.env.SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  try {
    // FIX: Manually supply siteID and token so branch deploys can access the store
    const commentsStore = getStore({
      name: "site-comments",
      siteID: siteID,
      token: token
    });
    
    // 1. List all active keys inside your blob store
    const list = await commentsStore.list();
    const commentPromises = list.blobs.map(b => commentsStore.get(b.key, { type: "json" }));
    
    // 2. Resolve all entry values simultaneously
    const rawComments = await Promise.all(commentPromises);

    // 3. Sort chronologically (Newest first)
    const comments = rawComments
      .filter(Boolean)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(({ token, ...publicData }) => publicData); // Hide delete token from public

    return new Response(JSON.stringify(comments), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache" 
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
