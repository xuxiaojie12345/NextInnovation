const http = require('http');
const data = JSON.stringify([
    {productClass: '02', number: 13, market: 'CHN'}
]);
const options = {
    hostname: 'localhost',
    port: 8081,
    path: '/api/ud09DeleteHdocuserdefinedrules/deleteSelected',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};
const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', body);
    });
});
req.on('error', (e) => console.error('Error:', e));
req.write(data);
req.end();
