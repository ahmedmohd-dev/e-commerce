const https = require("https");
const http = require("http");

const data = JSON.stringify({
  uid: "AbWGS7hqF7XTCs9eMZC4m6QYetD3",
});

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/_util/make-admin?secret=my-secret-key-123",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

const req = http.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  console.log(`headers:`, res.headers);

  res.on("data", (d) => {
    process.stdout.write(d);
  });
});

req.on("error", (error) => {
  console.error(error);
});

req.write(data);
req.end();


