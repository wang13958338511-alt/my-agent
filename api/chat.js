// api/chat.js
import { NextRequest, NextResponse } from 'next/server';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

export const config = {
  runtime: 'edge', // 使用 Edge Runtime，更快更便宜
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Only POST allowed' }, { status: 405 });
  }

  const { message, role } = await req.json();

  const rolePrompts = {
    "导师": "你是一名资深计算机科学导师，擅长用通俗语言解释复杂概念，注重基础与逻辑。",
    "研究员": "你是一名人工智能领域研究员，熟悉论文写作、实验设计与前沿技术分析。",
    "写作助手": "你是一名学术写作专家，擅长润色、结构调整和符合学术规范的表达。"
  };

  const systemPrompt = rolePrompts[role] || rolePrompts["导师"];

  try {
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

    if (data.output?.choices?.[0]?.message?.content) {
      return NextResponse.json({ reply: data.output.choices[0].message.content });
    } else {
      console.error("API Error:", data);
      return NextResponse.json({ reply: "抱歉，模型返回异常。" });
    }
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ reply: "服务暂时不可用，请稍后再试。" });
  }
}