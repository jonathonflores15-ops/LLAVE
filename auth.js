{
  "name": "llave-server",
  "private": true,
  "version": "0.2.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2"
  },
  "optionalDependencies": {
    "stripe": "^16.12.0"
  }
}
