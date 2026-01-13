// Vercel Serverless Function - 阿里云百炼API代理
// 路径: /api/qwen-proxy

export default async function handler(req, res) {
    // 设置CORS头，允许MasterGo插件调用
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { description, count } = req.body;

        // 验证请求参数
        if (!description || typeof description !== 'string') {
            return res.status(400).json({ error: '缺少description参数' });
        }

        if (!count || typeof count !== 'number' || count < 1) {
            return res.status(400).json({ error: 'count必须是大于等于1的正整数' });
        }

        // 阿里云百炼API配置
        const apiKey = 'sk-42eced2107df4922b33311c52d2f24dd';
        const apiUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

        // 构建提示词，要求生成N个不重复的值
        const prompt = `请生成${count}个符合以下描述的值，要求彼此不重复，每个值单独一行，不要编号，不要其他说明文字：\n${description}`;

        // 调用阿里云百炼API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'qwen-turbo',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('百炼API错误:', response.status, errorText);
            return res.status(response.status).json({ 
                error: `API请求失败: ${response.status}`,
                details: errorText 
            });
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            return res.status(500).json({ error: 'API返回数据格式错误' });
        }

        // 解析返回的文本，按行分割并过滤空行
        const generatedText = data.choices[0].message.content.trim();
        const lines = generatedText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .slice(0, count); // 只取前N个

        if (lines.length < count) {
            return res.status(500).json({ 
                error: `生成的文本数量不足，需要${count}个，实际生成${lines.length}个`,
                generated: lines 
            });
        }

        // 返回成功结果
        return res.status(200).json({
            success: true,
            texts: lines,
            count: lines.length
        });

    } catch (error) {
        console.error('代理服务器错误:', error);
        return res.status(500).json({ 
            error: '服务器内部错误',
            message: error.message 
        });
    }
}
