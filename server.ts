import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini AI SDK if API key is available
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Mock database for VPN servers and clients
let vpnServers = [
  {
    id: 'svr-1',
    name: 'US East (New York)',
    country: 'United States',
    flag: '🇺🇸',
    ip: '198.51.100.24',
    port: 51820,
    protocol: 'WireGuard',
    status: 'online',
    load: 34,
    ping: 28,
    speed: 940,
    tunnelsCount: 142,
    bandwidthUsed: '1.2 TB',
  },
  {
    id: 'svr-2',
    name: 'Germany (Frankfurt)',
    country: 'Germany',
    flag: '🇩🇪',
    ip: '185.220.101.5',
    port: 1194,
    protocol: 'OpenVPN',
    status: 'online',
    load: 68,
    ping: 42,
    speed: 850,
    tunnelsCount: 215,
    bandwidthUsed: '2.8 TB',
  },
  {
    id: 'svr-3',
    name: 'Japan (Tokyo)',
    country: 'Japan',
    flag: '🇯🇵',
    ip: '133.242.10.88',
    port: 8443,
    protocol: 'VMess / V2Ray',
    status: 'online',
    load: 45,
    ping: 110,
    speed: 780,
    tunnelsCount: 98,
    bandwidthUsed: '950 GB',
  },
  {
    id: 'svr-4',
    name: 'UK (London)',
    country: 'United Kingdom',
    flag: '🇬🇧',
    ip: '51.158.12.90',
    port: 443,
    protocol: 'Trojan',
    status: 'online',
    load: 52,
    ping: 35,
    speed: 910,
    tunnelsCount: 167,
    bandwidthUsed: '1.6 TB',
  },
  {
    id: 'svr-5',
    name: 'UAE (Dubai)',
    country: 'United Arab Emirates',
    flag: '🇦🇪',
    ip: '94.200.12.15',
    port: 51820,
    protocol: 'WireGuard',
    status: 'maintenance',
    load: 95,
    ping: 75,
    speed: 500,
    tunnelsCount: 45,
    bandwidthUsed: '430 GB',
  },
  {
    id: 'svr-6',
    name: 'Singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    ip: '128.199.204.1',
    port: 8388,
    protocol: 'Shadowsocks',
    status: 'online',
    load: 28,
    ping: 95,
    speed: 890,
    tunnelsCount: 112,
    bandwidthUsed: '1.1 TB',
  }
];

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/servers', (req, res) => {
  res.json(vpnServers);
});

app.post('/api/servers', (req, res) => {
  const newServer = {
    id: `svr-${Date.now()}`,
    ...req.body,
    status: 'online',
    load: Math.floor(Math.random() * 40) + 10,
    ping: Math.floor(Math.random() * 80) + 20,
    speed: Math.floor(Math.random() * 300) + 700,
    tunnelsCount: 1,
    bandwidthUsed: '0 GB',
  };
  vpnServers.unshift(newServer);
  res.status(201).json(newServer);
});

app.delete('/api/servers/:id', (req, res) => {
  const { id } = req.params;
  vpnServers = vpnServers.filter(s => s.id !== id);
  res.json({ success: true, id });
});

// AI Assistant / VPN Network Advisor endpoint using Gemini AI
app.post('/api/ai-assistant', async (req, res) => {
  const { prompt, context } = req.body;

  if (!ai) {
    return res.status(500).json({
      error: 'Gemini AI API key is not configured. Please set GEMINI_API_KEY in secrets.'
    });
  }

  try {
    const systemInstruction = `You are NexusVPN AI Core, an expert network engineer and cybersecurity specialist specializing in VPN architectures (WireGuard, OpenVPN, Shadowsocks, VMess/V2Ray, Trojan), routing optimization, firewall bypass, and server hardening. 
Provide concise, highly accurate, professional, and actionable technical advice, configuration snippets, and diagnostic steps. You can respond in English or Arabic depending on the user's language.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemInstruction}\n\nContext:\n${JSON.stringify(context || {})}\n\nUser Question:\n${prompt}` }] }
      ],
    });

    const text = response.text || 'No response generated.';
    res.json({ reply: text });
  } catch (error: any) {
    console.error('Gemini AI error:', error);
    res.status(500).json({ error: error.message || 'AI request failed' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NexusVPN Pro Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
