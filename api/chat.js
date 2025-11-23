// api/chat.js

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // 只允许 POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { message, role } = await request.json();

    const rolePrompts = {
      "导师": "你是一名资深计算机科学导师，擅长用通俗语言解释复杂概念，注重基础与逻辑。",
      "研究员": "你是一名人工智能领域研究员，熟悉论文写作、实验设计与前沿技术分析。",
      "写作助手": "你是一名学术写作专家，擅长润色、结构调整和符合学术规范的表达。"
    };

    const systemPrompt = rolePrompts[role] || rolePrompts["导师"];

    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "qwen-max",
        input: {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ]
        },
        parameters: {
          result_format: "message"
        }
      })
    });

    const data = await response.json();

    let reply = "服务暂时不可用，请稍后再试。";
    if (data.output?.choices?.[0]?.message?.content) {
      reply = data.output.choices[0].message.content;
    } else {
      console.error("DashScope API Error:", data);
    }

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Handler error:", error);
    return new Response(JSON.stringify({ reply: "内部错误，请重试。" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}