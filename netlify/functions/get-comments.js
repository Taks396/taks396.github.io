const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const SITE_ID = process.env.SITE_ID; 
  const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN; 

  try {
    // 1. Fetch form submissions from Netlify API
    const response = await fetch(`https://netlify.com{SITE_ID}/submissions`, {
      headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch from Netlify API');
    const data = await response.json();

    // 2. Filter for your comment form structure and map fields cleanly
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(comments)
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
