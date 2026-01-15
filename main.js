// 用于展示插件用户界面
console.log('插件初始化开始...');
mg.showUI(__html__)
console.log('插件UI已显示');

// 获取选中的形状图层（排除文本图层）
function getSelectedShapeLayers() {
    try {
        console.log('开始获取选中图层...');
        
        // 根据 MasterGo 官方文档，使用 mg.document.currentPage.selection
        let selection = [];
        
        try {
            // 检查 mg.document 是否存在
            if (!mg.document) {
                console.log('mg.document 不存在');
                return [];
            }
            
            // 获取当前页面
            const currentPage = mg.document.currentPage;
            if (!currentPage) {
                console.log('mg.document.currentPage 不存在');
                return [];
            }
            
            // 获取选中图层（根据官方文档）
            selection = currentPage.selection;
            
            // 检查 selection 是否为数组
            if (!Array.isArray(selection)) {
                console.log('selection 不是数组:', typeof selection);
                // 如果不是数组，尝试转换为数组
                if (selection) {
                    selection = [selection];
                } else {
                    selection = [];
                }
            }
            
            console.log('获取到的选中图层数量:', selection.length);
            
            if (selection.length === 0) {
                console.log('没有选中任何图层');
                return [];
            }
            
        } catch (e) {
            console.error('获取 selection 时出错:', e.message);
            return [];
        }
        
        // 过滤出形状图层（排除文本图层）
        const shapeLayers = [];
        for (let i = 0; i < selection.length; i++) {
            try {
                const node = selection[i];
                if (!node) continue;
                
                // 检查节点类型，排除文本图层
                const nodeType = node.type;
                if (nodeType && nodeType !== 'TEXT' && nodeType !== 'text') {
                    // 检查是否有 fills 属性（形状图层通常有 fills 属性）
                    if (node.fills !== undefined) {
                        shapeLayers.push(node);
                        console.log(`添加形状图层 ${i}，类型: ${nodeType}`);
                    }
                }
            } catch (e) {
                console.log('处理节点时出错:', e.message);
            }
        }
        
        console.log('筛选后的形状图层数量:', shapeLayers.length);
        return shapeLayers;
    } catch (error) {
        console.error('获取选中图层失败:', error.message);
        return [];
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
        console.log('处理提交请求，关键词:', actualMsg.keyword);
        const keyword = actualMsg.keyword;
        const fillMode = actualMsg.fillMode || 'FILL';
        
        // 发送加载状态
        mg.ui.postMessage({ type: 'loading', message: '正在处理...' });
        
        try {
            // 1. 获取选中的形状图层
            const shapeLayers = getSelectedShapeLayers();
            
            if (shapeLayers.length === 0) {
                mg.ui.postMessage({ type: 'error', message: '请先选中形状图层（矩形、圆形等）' });
                if (mg.notify) {
                    mg.notify('请先选中形状图层（矩形、圆形等）');
                }
                return;
            }
            
            const count = shapeLayers.length;
            
            // 2. 请求 UI 调用 API 搜索图片（因为主线程无法使用 fetch）
            console.log('准备请求UI调用API，选中图层数量:', count);
            const requestMessage = { 
                type: 'request-api', 
                keyword: keyword,
                count: count,
                fillMode: fillMode
            };
            console.log('主线程发送消息给UI:', JSON.stringify(requestMessage));
            mg.ui.postMessage(requestMessage);
            console.log('主线程消息已发送');
            
        } catch (error) {
            const errorMessage = error.message || '处理失败，请重试';
            mg.ui.postMessage({ type: 'error', message: errorMessage });
            if (mg.notify) {
                mg.notify(errorMessage);
            }
            console.error('处理失败:', error);
        }
    }
    
    // 处理来自 UI 的 API 响应
    if (actualMsg.type === 'api-response') {
        console.log('收到API响应:', actualMsg);
        console.log('API响应内容:', JSON.stringify(actualMsg));
        
        if (actualMsg.error) {
            console.log('API响应包含错误:', actualMsg.error);
            mg.ui.postMessage({ type: 'error', message: actualMsg.error });
            if (mg.notify) {
                mg.notify(actualMsg.error);
            }
            return;
        }
        
        if (!actualMsg.images || !Array.isArray(actualMsg.images)) {
            console.error('API返回数据格式错误:', actualMsg);
            const errorMsg = 'API返回数据格式错误';
            mg.ui.postMessage({ type: 'error', message: errorMsg });
            if (mg.notify) {
                mg.notify(errorMsg);
            }
            return;
        }
        
        console.log('API返回图片数组:', actualMsg.images);
        console.log('图片数量:', actualMsg.images.length);
        
        // 获取选中的形状图层
        console.log('开始获取选中的形状图层...');
        const shapeLayers = getSelectedShapeLayers();
        console.log('获取到的形状图层数量:', shapeLayers.length);
        
        if (shapeLayers.length === 0) {
            console.error('未找到选中的形状图层');
            const errorMsg = '未找到选中的形状图层';
            mg.ui.postMessage({ type: 'error', message: errorMsg });
            if (mg.notify) {
                mg.notify(errorMsg);
            }
            return;
        }
        
        const fillMode = actualMsg.fillMode || 'FILL';
        
        // 请求 UI 下载图片数据
        console.log('请求UI下载图片数据...');
        mg.ui.postMessage({
            type: 'download-images',
            images: actualMsg.images,
            fillMode: fillMode
        });
    }
    
    // 处理来自 UI 的图片数据
    if (actualMsg.type === 'image-data') {
        console.log('收到图片数据:', actualMsg);
        
        try {
            const shapeLayers = getSelectedShapeLayers();
            const imageDataArray = actualMsg.imageData; // 普通数组
            const fillMode = actualMsg.fillMode || 'FILL';
            const imageIndex = actualMsg.index || 0;
            
            if (imageIndex >= shapeLayers.length) {
                console.log('图片索引超出范围');
                return;
            }
            
            const layer = shapeLayers[imageIndex];
            
            // 将普通数组转换为 Uint8Array
            const imageData = new Uint8Array(imageDataArray);
            
            // 创建图片对象
            console.log(`创建图片 ${imageIndex}，数据长度: ${imageData.length}`);
            const imageHandle = await mg.createImage(imageData);
            
            // 设置图片填充（Image as Mask）
            console.log(`设置图层 ${imageIndex} 的图片填充，模式: ${fillMode}`);
            
            // 克隆 fills 数组
            const newFills = JSON.parse(JSON.stringify(layer.fills || []));
            
            // 创建图片填充对象
            const imageFill = {
                type: 'IMAGE',
                scaleMode: fillMode, // FILL, STRETCH, TILE
                imageRef: imageHandle.href
            };
            
            // 替换或添加图片填充
            // 如果已有图片填充，替换第一个；否则添加
            const imageFillIndex = newFills.findIndex(fill => fill.type === 'IMAGE');
            if (imageFillIndex >= 0) {
                newFills[imageFillIndex] = imageFill;
            } else {
                newFills.unshift(imageFill); // 添加到最前面
            }
            
            layer.fills = newFills;
            
            console.log(`图层 ${imageIndex} 填充成功`);
            
            // 检查是否所有图片都已处理
            if (imageIndex === shapeLayers.length - 1) {
                // 发送成功消息
                console.log('所有图层填充完成，发送成功消息');
                mg.ui.postMessage({ type: 'success', message: `成功填充${shapeLayers.length}个形状图层` });
                if (mg.notify) {
                    mg.notify(`成功填充${shapeLayers.length}个形状图层`);
                }
                console.log('成功消息已发送');
            }
            
        } catch (error) {
            console.error('处理图片数据失败:', error);
            mg.ui.postMessage({ type: 'error', message: `填充失败: ${error.message}` });
            if (mg.notify) {
                mg.notify(`填充失败: ${error.message}`);
            }
        }
    }
}
