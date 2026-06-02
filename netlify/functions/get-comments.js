exports.handler = async function(event, context) {
  const SITE_ID = process.env.SITE_ID; 
  const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN; 

  // Debugging logs to pinpoint the issue in your Netlify Panel
  console.log("Checking credentials...");
  console.log("Site ID exists:", !!SITE_ID);
  console.log("Auth Token exists:", !!NETLIFY_TOKEN);

  if (!NETLIFY_TOKEN || !SITE_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing environment variables on this branch context." })
    };
  }

  try {
    // Using Node's native global fetch API (No imports or require statements required)
    const response = await fetch(`https://netlify.com{SITE_ID}/submissions`, {
      headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` }
    });
    
    if (!response.ok) {
      console.error(`Netlify API responded with status: ${response.status}`);
      throw new Error('Failed to pull submissions from Netlify API');
    }
    
    const data = await response.json();

    // Safely extract and filter submissions
    const comments = data
      .filter(sub => sub.form_name === 'site-feedback')
      .map(sub => ({
        submission_id: sub.id,
        id: sub.data.comment_id,
        name: sub.data.name || 'Anonymous',
        message: sub.data.comment,
        date: sub.created_at
      }));

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache" 
      },
      body: JSON.stringify(comments)
    };
  } catch (error) {
    console.error("Function exception caught:", error.message);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};
