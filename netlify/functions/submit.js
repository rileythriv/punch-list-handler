const https = require('https');

exports.handler = async function(event) {
  console.log('Function called with method:', event.httpMethod);
  
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    console.log('Parsing body...');
    const params = JSON.parse(event.body);
    console.log('Body parsed, to_email:', params.to_email);
    console.log('PDF length:', params.pdf ? params.pdf.length : 'none');

    const result = await callGoogleScript(params);
    console.log('Google Script result:', result);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    };

  } catch(err) {
    console.log('Error:', err.toString());
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: err.toString() })
    };
  }
};

function callGoogleScript(params) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(params);
    console.log('Calling Google Script, data size:', postData.length);

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
      console.log('Google Script response status:', res.statusCode);
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Google Script response:', data.substring(0, 200));
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve({ success: false, error: 'Invalid response: ' + data.substring(0, 100) });
        }
      });
    });

    req.on('error', (err) => {
      console.log('Request error:', err.toString());
      reject(err);
    });

    req.setTimeout(25000, () => {
      console.log('Request timed out');
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.write(postData);
    req.end();
  });
}
