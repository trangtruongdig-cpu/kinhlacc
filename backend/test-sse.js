const EventSource = require('eventsource'); // or we can use native fetch

async function run() {
  // Login to get token first
  const res = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '0987654321', password: '123' }) // replace with real admin
  });
  // Actually we don't have password. We can generate a token.
}
run();
