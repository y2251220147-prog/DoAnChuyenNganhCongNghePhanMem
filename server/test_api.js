const http = require('http');

http.get('http://localhost:5000/api/users', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log("API RESPONSE:", data.substring(0, 500) + "...");
        const users = JSON.parse(data);
        const nguyenNhu = users.find(u => u.name === 'Nguyễn Như');
        console.log("Nguyễn Như Info:", JSON.stringify(nguyenNhu, null, 2));
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
