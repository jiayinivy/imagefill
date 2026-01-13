// 用于展示插件用户界面
console.log('插件初始化开始...');
mg.showUI(__html__)
console.log('插件UI已显示');

// 调用Vercel代理API生成文本
const PROXY_URL = 'https://textfill-ten.vercel.app/api/qwen-proxy';

async function callQwenAPI(description, count) {
    try {
        console.log('开始调用代理API:', PROXY_URL);
        console.log('请求参数:', { description, count });
        
        const requestBody = {
            description: description,
            count: count
        };
        
        console.log('发送请求...');
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('收到响应:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API响应错误:', response.status, errorText);
            let errorData = {};
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: errorText };
            }
            throw new Error(errorData.error || `API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API返回数据:', data);
        
        if (!data.success || !data.texts || !Array.isArray(data.texts)) {
            throw new Error(data.error || 'API返回数据格式错误');
        }
        
        if (data.texts.length < count) {
            throw new Error(`生成的文本数量不足，需要${count}个，实际生成${data.texts.length}个`);
        }
        
        console.log('成功获取文本:', data.texts);
        return data.texts;
    } catch (error) {
        console.error('调用代理API失败:', error);
        console.error('错误详情:', error.message, error.stack);
        throw error;
    }
}

// 获取选中的文字图层
function getSelectedTextLayers() {
    try {
        console.log('开始获取选中图层...');
        
        // 尝试不同的API方式获取选中图层
        let selection = [];
        
        // 方法1: 使用 mg.currentPage.selection
        try {
            if (mg.currentPage) {
                selection = mg.currentPage.selection;
                console.log('使用 mg.currentPage.selection，数量:', selection ? selection.length : 0);
            }
        } catch (e) {
            console.log('mg.currentPage.selection 失败:', e.message);
        }
        
        // 方法2: 如果方法1失败，尝试 mg.selection
        if (!selection || selection.length === 0) {
            try {
                if (mg.selection) {
                    selection = mg.selection;
                    console.log('使用 mg.selection，数量:', selection ? selection.length : 0);
                }
            } catch (e) {
                console.log('mg.selection 失败:', e.message);
            }
        }
        
        // 方法3: 尝试使用函数
        if (!selection || selection.length === 0) {
            try {
                if (typeof mg.getSelection === 'function') {
                    selection = mg.getSelection();
                    console.log('使用 mg.getSelection()，数量:', selection ? selection.length : 0);
                }
            } catch (e) {
                console.log('mg.getSelection() 失败:', e.message);
            }
        }
        
        if (!selection || selection.length === 0) {
            console.log('未获取到选中图层');
            return [];
        }
        
        console.log('获取到的选中图层数量:', selection.length);
        
        // 筛选出文字图层（避免直接访问对象属性导致 unwrap 错误）
        const textLayers = [];
        for (let i = 0; i < selection.length; i++) {
            try {
                const node = selection[i];
                // 尝试安全地检查节点类型
                let nodeType = null;
                let hasCharacters = false;
                
                try {
                    nodeType = node.type;
                } catch (e) {
                    // 忽略错误
                }
                
                try {
                    hasCharacters = node.characters !== undefined;
                } catch (e) {
                    // 忽略错误
                }
                
                if (node && (nodeType === 'TEXT' || nodeType === 'text' || hasCharacters)) {
                    textLayers.push(node);
                    console.log('找到文字图层:', i, nodeType);
                }
            } catch (e) {
                console.log('检查节点时出错:', e.message);
            }
        }
        
        console.log('筛选后的文字图层数量:', textLayers.length);
        return textLayers;
    } catch (error) {
        console.error('获取选中图层失败:', error.message);
        return [];
    }
}

// 替换文字图层内容
function replaceTextLayerContent(layer, text) {
    try {
        if (layer.characters !== undefined) {
            layer.characters = text;
        } else if (layer.setText) {
            layer.setText(text);
        } else if (layer.text) {
            layer.text = text;
        } else {
            throw new Error('无法修改文字图层内容');
        }
    } catch (error) {
        console.error('替换文字图层内容失败:', error);
        throw error;
    }
}

// 接收来自 UI 的消息
console.log('设置消息监听器...');
mg.ui.onmessage = async (msg) => {
    console.log('收到UI消息:', msg);
    console.log('消息类型:', typeof msg);
    console.log('消息内容:', JSON.stringify(msg));
    
    // 检查消息格式，可能是包装在 pluginMessage 中
    let actualMsg = msg;
    if (msg && msg.pluginMessage) {
        console.log('消息被包装在 pluginMessage 中，提取实际消息');
        actualMsg = msg.pluginMessage;
    }
    
    console.log('实际消息:', actualMsg);
    console.log('消息类型字段:', actualMsg.type);
    
    if (actualMsg.type === 'submit') {
        console.log('处理提交请求，描述:', actualMsg.text);
        const description = actualMsg.text;
        
        // 发送加载状态
        mg.ui.postMessage({ type: 'loading', message: '正在处理...' });
        
        try {
            // 1. 获取选中的文字图层
            const textLayers = getSelectedTextLayers();
            
            if (textLayers.length === 0) {
                mg.ui.postMessage({ type: 'error', message: '请先选中文字图层' });
                if (mg.notify) {
                    mg.notify('请先选中文字图层');
                }
                return;
            }
            
            const count = textLayers.length;
            
            // 2. 调用阿里云千问API生成文本
            console.log('准备调用API，选中图层数量:', count);
            mg.ui.postMessage({ type: 'loading', message: `正在生成${count}个文本...` });
            
            console.log('开始调用 callQwenAPI...');
            const generatedTexts = await callQwenAPI(description, count);
            console.log('API调用完成，返回文本:', generatedTexts);
            
            // 3. 替换文字图层内容
            for (let i = 0; i < textLayers.length && i < generatedTexts.length; i++) {
                replaceTextLayerContent(textLayers[i], generatedTexts[i]);
            }
            
            // 4. 发送成功消息
            mg.ui.postMessage({ type: 'success', message: `成功填充${generatedTexts.length}个文字图层` });
            if (mg.notify) {
                mg.notify(`成功填充${generatedTexts.length}个文字图层`);
            }
            
        } catch (error) {
            const errorMessage = error.message || '处理失败，请重试';
            mg.ui.postMessage({ type: 'error', message: errorMessage });
            if (mg.notify) {
                mg.notify(errorMessage);
            }
            console.error('处理失败:', error);
        }
    }
}