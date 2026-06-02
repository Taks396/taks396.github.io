const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const SITE_ID = process.env.SITE_ID;
  const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN;

  try {
    const { submissionId, commentId, token } = JSON.parse(event.body);

    // 1. Fetch the exact single submission to verify token validation
    const checkRes = await fetch(`https://netlify.com{submissionId}`, {
      headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` }
    });
    
    if (!checkRes.ok) return { statusCode: 404, body: 'Comment not found' };
    const submission = await checkRes.json();

    // 2. Validate token matched what was natively stored
    if (submission.data.delete_token !== token || submission.data.comment_id !== commentId) {
      return { statusCode: 403, body: 'Unauthorized deletion request' };
    }

    // 3. Perform the safe execution delete request
    const deleteRes = await fetch(`https://netlify.com{submissionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` }
    });

    if (!deleteRes.ok) throw new Error('Netlify API rejected deletion');

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
