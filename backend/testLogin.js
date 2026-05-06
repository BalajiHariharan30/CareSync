// Direct test - calls the login API and prints exact response
const http = require('http');

const body = JSON.stringify({ email: 'admin@caresync.com', password: 'admin123' });

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
    },
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('HTTP Status:', res.statusCode);
        console.log('Response Body:', data);
        const parsed = JSON.parse(data);
        console.log('\n--- Parsed ---');
        console.log('isAdmin :', parsed.isAdmin);
        console.log('isDoctor:', parsed.isDoctor);
        console.log('name    :', parsed.name);
        console.log('email   :', parsed.email);
    });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.write(body);
req.end();
