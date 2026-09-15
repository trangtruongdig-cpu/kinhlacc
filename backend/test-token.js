const jwt = require('jsonwebtoken');

const token = jwt.sign({ sub: 1, username: 'admin', role: 'admin' }, 'trangtd', { expiresIn: '1d' });
console.log('TOKEN:', token);
