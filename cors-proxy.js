const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3101;

// CORS middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Proxy middleware
app.use('/', createProxyMiddleware({
  target: 'http://loki:3100', // Docker network'te loki service name'i kullan
  changeOrigin: true,
  pathRewrite: {
    '^/': '/loki/api/v1/'
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error');
  }
}));

app.listen(PORT, () => {
  console.log(`CORS proxy running on http://localhost:${PORT}`);
  console.log('Proxying requests to http://localhost:3100/loki/api/v1/');
});
