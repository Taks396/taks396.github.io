import { getStore } from "@netlify/blobs";

export const handler = async () => {
  try {
    const commentsStore = getStore("site-comments");
    
    // 1. List all keys inside our comment blob database store
    const list = await commentsStore.list();
    const commentPromises = list.blobs.map(b => commentsStore.get(b.key, { type: "json" }));
    
    // 2. Fetch all entries simultaneously
    const rawComments = await Promise.all(commentPromises);

    // 3. Sort by creation date (Newest entries on top)
    const comments = rawComments
      .filter(Boolean)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(({ token, ...publicData }) => publicData); // Strip the delete token before passing to browser

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify(comments)
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
