const https = require('https');

exports.handler = async function(event, context) {
  const SITE_ID = process.env.SITE_ID; 
  const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN; 

  if (!NETLIFY_TOKEN || !SITE_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Environment variables missing on this branch context." })
    };
  }

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.netlify.com',
      path: `/api/v1/sites/${SITE_ID}/submissions`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'User-Agent': 'Netlify-Serverless-Function'
      }
    };

    const req = https.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            return resolve({
              statusCode: res.statusCode,
              body: JSON.stringify({ error: `Netlify API responded with status ${res.statusCode}` })
            });
          }

          const data = JSON.parse(rawData);
          const uniqueCommentsMap = new Map();

          data
            .filter(sub => sub.form_name === 'site-feedback' && sub.data)
            .forEach(sub => {
              // SAFETY FIX: Fallback to submission ID if comment_id is missing/old
              const id = sub.data.comment_id || `old-${sub.id}`;
              
              if (!uniqueCommentsMap.has(id)) {
                uniqueCommentsMap.set(id, {
                  submission_id: sub.id,
                  id: id,
                  name: sub.data.name || 'Anonymous',
                  message: sub.data.comment || '',
                  date: sub.created_at
                });
              }
            });

          const comments = Array.from(uniqueCommentsMap.values());

          resolve({
            statusCode: 200,
            headers: { 
              "Content-Type": "application/json",
              "Cache-Control": "no-cache" 
            },
            body: JSON.stringify(comments)
          });
        } catch (e) {
          resolve({ statusCode: 500, body: JSON.stringify({ error: "Failed to parse API data" }) });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 500, body: JSON.stringify({ error: err.message }) });
    });

    req.end();
  });
};
