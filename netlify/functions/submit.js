const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const params = JSON.parse(event.body);

    return new Promise((resolve) => {
      const postData = JSON.stringify(params);
      const options = {
        hostname: 'script.google.com',
        path: '/macros/s/AKfycbxBRjYk_VPNMGdLPi60MfeC7bz_xxN6bqNvv1cCZHr3FHEzQtEgJkINrmXNkWrHA8S7/exec',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Content-Type': 'application/json'
            },
            body: data
          });
        });
      });

      req.on('error', (err) => {
        resolve({
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: false, error: err.toString() })
        });
      });

      req.write(postData);
      req.end();
    });

  } catch(err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: err.toString() })
    };
  }
};
