// Vercel Serverless Function - Unsplash API代理
// 路径: /api/unsplash-proxy

module.exports = async function handler(req, res) {
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
        const { keyword, count } = req.body;

        // 验证请求参数
        if (!keyword || typeof keyword !== 'string') {
            return res.status(400).json({ error: '缺少keyword参数' });
        }

        if (!count || typeof count !== 'number' || count < 1) {
            return res.status(400).json({ error: 'count必须是大于等于1的正整数' });
        }

        // Unsplash API配置
        const accessKey = 'LRbxt00ShwcTdcoeJJujzoMW7ppZOK3uk5a6g7CXgF4o';
        const apiUrl = 'https://api.unsplash.com/search/photos';

        // 调用 Unsplash API 搜索图片
        const response = await fetch(`${apiUrl}?query=${encodeURIComponent(keyword)}&per_page=${Math.min(count, 30)}&orientation=landscape`, {
            method: 'GET',
            headers: {
                'Authorization': `Client-ID ${accessKey}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Unsplash API错误:', response.status, errorText);
            return res.status(response.status).json({ 
                error: `Unsplash API请求失败: ${response.status}`,
                details: errorText 
            });
        }

        const data = await response.json();

        if (!data.results || !Array.isArray(data.results)) {
            return res.status(500).json({ error: 'Unsplash API返回数据格式错误' });
        }

        // 提取图片URL（使用regular尺寸，如果不够则使用full）
        const images = data.results.slice(0, count).map(photo => ({
            id: photo.id,
            url: photo.urls.regular || photo.urls.full || photo.urls.small,
            thumbUrl: photo.urls.thumb || photo.urls.small,
            description: photo.description || photo.alt_description || keyword,
            author: photo.user.name,
            authorUrl: photo.user.links.html
        }));

        if (images.length < count) {
            return res.status(200).json({
                success: true,
                images: images,
                count: images.length,
                warning: `只找到${images.length}张图片，少于请求的${count}张`
            });
        }

        // 返回成功结果
        return res.status(200).json({
            success: true,
            images: images,
            count: images.length
        });

    } catch (error) {
        console.error('代理服务器错误:', error);
        return res.status(500).json({ 
            error: '服务器内部错误',
            message: error.message 
        });
    }
}
