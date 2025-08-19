export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

    const body = await read(req);
    const { messages = [] } = body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY on server' });
    }

    const system = {
      role: 'system',
      content: 'You are SoulSync, a warm, supportive companion. Use CBT-style reframing when helpful. Keep answers concise and kind.',
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [system, ...messages],
        temperature: 0.7,
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ error: `OpenAI error: ${text}` });
    }

    const data = await r.json();
    const answer = data?.choices?.[0]?.message?.content || '';
    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

function read(req){
  return new Promise((resolve,reject)=>{
    let b=''; req.on('data',c=>b+=c);
    req.on('end',()=>{ try{ resolve(JSON.parse(b||'{}')) } catch(e){ reject(e) }});
  });
}
