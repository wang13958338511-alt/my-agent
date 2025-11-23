// api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { message, role } = req.body;

  // 角色提示词（根据作业要求）
  const rolePrompts = {
    "导师": "你是一位计算机科学专业导师，擅长用清晰易懂的方式解释复杂概念。",
    "研究员": "你是一位AI领域研究员，回答需严谨、专业，引用最新技术趋势。",
    "写作助手": "你是一位学术写作助手，帮助用户润色论文、组织逻辑、提升表达。"
  };

  const systemPrompt = rolePrompts[role] || rolePrompts["导师"];

  try {
    const dashResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`, // 👈 注意这里是 API_KEY
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "qwen-plus-2025-07-28", // 👈 百炼专用模型名
        input: {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ]
        },
        parameters: {
          result_format: "message",
          enable_thinking: true // 开启深度思考（可选）
        }
      })
    });

    const data = await dashResponse.json();

    if (data.output?.choices?.[0]?.message?.content) {
      const reply = data.output.choices[0].message.content;
      return res.status(200).json({ reply });
    } else {
      console.error("API 返回异常:", data);
      return res.status(500).json({ reply: "服务暂时不可用，请稍后再试。" });
    }

  } catch (error) {
    console.error("调用失败:", error);
    return res.status(500).json({ reply: "网络错误，请稍后再试。" });
  }
}