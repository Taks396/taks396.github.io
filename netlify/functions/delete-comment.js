const https = require('https');

// Helper wrapper to process pure HTTPS requests natively
function makeHttpsRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const SITE_ID = process.env.SITE_ID;
  const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN;

  try {
    const { submissionId, commentId, token } = JSON.parse(event.body);

    // 1. Fetch single submission data to verify token
    const checkOptions = {
      hostname: 'api.netlify.com',
      path: `/api/v1/submissions/${submissionId}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${NETLIFY_TOKEN}`, 'User-Agent': 'Netlify-Function' }
    };

    const checkRes = await makeHttpsRequest(checkOptions);
    if (checkRes.statusCode !== 200) return { statusCode: 404, body: 'Comment not found' };
    
    const submission = JSON.parse(checkRes.body);

    // 2. Validate token security credentials
    if (submission.data.delete_token !== token || submission.data.comment_id !== commentId) {
      return { statusCode: 403, body: 'Unauthorized deletion request' };
    }

    // 3. Issue native DELETE request
    const deleteOptions = {
      hostname: 'api.netlify.com',
      path: `/api/v1/submissions/${submissionId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${NETLIFY_TOKEN}`, 'User-Agent': 'Netlify-Function' }
    };

    const deleteRes = await makeHttpsRequest(deleteOptions);
    if (deleteRes.statusCode >= 300) throw new Error('Netlify API rejected deletion execution');

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
