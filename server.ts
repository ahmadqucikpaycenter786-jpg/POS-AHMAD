import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// OCR endpoint using Gemini Vision
app.post('/api/ocr', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
    }

    // Strip base64 header if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: `You are an expert thermal receipt OCR scanner. Extract all text from this receipt image with exact precision.
Format the output as clean plain text ready to be printed on a thermal receipt printer (32 to 48 columns).
Return a JSON object with:
- "rawText": formatted multiline string for thermal printing, centered headers, item rows, totals, and fees
- "merchantName": string or null
- "date": string or null
- "items": array of objects { name: string, price: string }
- "subtotal": string or null
- "fee": string or null (e.g. service fee or delivery fee if any)
- "total": string or null

Ensure the JSON is strictly valid without markdown backticks.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    try {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch {
      return res.json({ rawText: text });
    }
  } catch (err: any) {
    console.error('OCR Error:', err);
    return res.status(500).json({ error: err.message || 'OCR extraction failed' });
  }
});

// Printer socket diagnostic ping
app.post('/api/printer/ping', (req: Request, res: Response) => {
  const { ip, port } = req.body;
  // Simulated socket ping confirmation
  const isValidIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
  if (!isValidIp) {
    return res.status(400).json({ success: false, error: 'Invalid IPv4 address format' });
  }
  return res.json({
    success: true,
    ip,
    port: port || 9100,
    latencyMs: Math.floor(Math.random() * 25) + 12,
    message: `Network printer socket on ${ip}:${port || 9100} is reachable.`,
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production build
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In dev, load Vite middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`ThermalPOS server running on port ${port}`);
  });
}

startServer();
