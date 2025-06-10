require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
app.set('trust proxy', 1); // ✅ Fixes rate-limit crash on Render

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rate Limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// AI Proxy Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    console.log("🧠 Incoming:", messages);

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-4',
      messages
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("✅ OpenRouter Response:", response.data);
    res.json(response.data);

  } catch (error) {
    console.error('❌ Error:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to get AI response',
      details: error?.response?.data || error.message
    });
  }
});

// Fallback: serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
