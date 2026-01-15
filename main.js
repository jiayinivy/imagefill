// 用于展示插件用户界面
console.log('插件初始化开始...');
mg.showUI(__html__)
console.log('插件UI已显示');

// 保存当前处理的图层引用，避免异步处理时选中状态丢失
let currentShapeLayers = [];

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
            // 1. 立即锁定并保存选中的形状图层（锁定初始选择）
            const shapeLayers = getSelectedShapeLayers();
            
            if (shapeLayers.length === 0) {
                mg.ui.postMessage({ type: 'error', message: '请先选中形状图层（矩形、圆形等）' });
                if (mg.notify) {
                    mg.notify('请先选中形状图层（矩形、圆形等）');
                }
                return;
            }
            
            // 立即保存图层引用，锁定初始选择
            // 即使后续用户切换选中，也不影响当前操作流程
            currentShapeLayers = shapeLayers.slice(); // 复制数组，避免引用被修改
            console.log(`已锁定 ${currentShapeLayers.length} 个形状图层，后续切换选中不影响操作`);
            
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
        
        // 验证已锁定的图层引用（不重新获取，使用初始锁定）
        if (!currentShapeLayers || currentShapeLayers.length === 0) {
            console.error('图层引用已丢失');
            const errorMsg = '图层引用已丢失，请重新选择图层并重试';
            mg.ui.postMessage({ type: 'error', message: errorMsg });
            if (mg.notify) {
                mg.notify(errorMsg);
            }
            return;
        }
        
        const fillMode = actualMsg.fillMode || 'FILL';
        
        // 请求 UI 下载图片数据
        console.log('请求UI下载图片数据，使用已锁定的图层引用...');
        mg.ui.postMessage({
            type: 'download-images',
            images: actualMsg.images,
            fillMode: fillMode,
            layerCount: currentShapeLayers.length
        });
    }
    
    // 处理来自 UI 的图片数据
    if (actualMsg.type === 'image-data') {
        console.log('收到图片数据:', actualMsg);
        
        try {
            // 使用已锁定的图层引用（不重新获取，确保使用初始选择）
            const imageDataArray = actualMsg.imageData; // 普通数组
            const fillMode = actualMsg.fillMode || 'FILL';
            const imageIndex = actualMsg.index || 0;
            
            if (!currentShapeLayers || currentShapeLayers.length === 0) {
                console.error('图层引用已丢失');
                mg.ui.postMessage({ type: 'error', message: '图层引用已丢失，请重新选择图层并重试' });
                return;
            }
            
            if (imageIndex >= currentShapeLayers.length) {
                console.log('图片索引超出范围:', imageIndex, '>=', currentShapeLayers.length);
                return;
            }
            
            // 获取参考的形状图层（保持不变）
            const shapeLayer = currentShapeLayers[imageIndex];
            
            // 获取形状图层的尺寸和位置信息
            const shapeWidth = shapeLayer.width || 120;
            const shapeHeight = shapeLayer.height || 120;
            const shapeX = shapeLayer.x || 0;
            const shapeY = shapeLayer.y || 0;
            
            // 获取父容器
            const currentPage = mg.document.currentPage;
            const parent = shapeLayer.parent || currentPage;
            
            console.log(`处理图片 ${imageIndex + 1}/${currentShapeLayers.length}，形状尺寸: ${shapeWidth}×${shapeHeight}，位置: (${shapeX}, ${shapeY})`);
            
            // 将普通数组转换为 Uint8Array
            const imageData = new Uint8Array(imageDataArray);
            
            // 创建图片对象
            console.log(`创建图片对象，数据长度: ${imageData.length}`);
            const imageHandle = await mg.createImage(imageData);
            
            // 1. 创建图片图层（与形状图层在同一容器，位置居中对齐）
            // 图片尺寸：保持原始比例，缩放至短边刚好覆盖整个形状区域（object-fit: cover）
            // MasterGo 的 FILL 模式会自动实现此效果，并居中对齐
            const imageNode = mg.createRectangle();
            // 图片位置与形状图层位置相同，实现居中对齐
            imageNode.x = shapeX;
            imageNode.y = shapeY;
            imageNode.width = shapeWidth;
            imageNode.height = shapeHeight;
            
            // 设置图片填充（使用 FILL 模式实现 object-fit: cover 效果）
            imageNode.fills = [{
                type: 'IMAGE',
                scaleMode: 'FILL', // FILL 模式：保持比例，缩放至最小一边覆盖，居中对齐
                imageRef: imageHandle.href
            }];
            
            console.log(`图片图层创建成功，位置: (${shapeX}, ${shapeY})，与形状图层居中对齐`);
            
            // 2. 将图片图层添加到父容器（在形状图层上方）
            // 获取形状图层在父容器中的索引
            const shapeIndex = parent.children.indexOf(shapeLayer);
            if (shapeIndex >= 0) {
                // 在形状图层之后插入图片图层（图片在上方）
                parent.insertChild(shapeIndex + 1, imageNode);
            } else {
                // 如果找不到索引，直接添加到末尾
                parent.appendChild(imageNode);
            }
            
            console.log(`图片图层已添加到形状图层上方`);
            
            // 3. 设置形状图层为蒙版（作用于图片图层）
            // 根据 MasterGo API，设置蒙版的方式
            try {
                // 方式1：设置图片图层的 mask 属性指向形状图层
                if (imageNode.mask !== undefined) {
                    imageNode.mask = shapeLayer;
                }
                // 方式2：设置形状图层的 isMask 属性
                if (shapeLayer.isMask !== undefined) {
                    shapeLayer.isMask = true;
                }
                // 方式3：调用形状图层的 setAsMask 方法
                if (shapeLayer.setAsMask && typeof shapeLayer.setAsMask === 'function') {
                    shapeLayer.setAsMask();
                }
            } catch (e) {
                console.warn('设置蒙版时出错，尝试其他方式:', e);
                try {
                    // 尝试直接设置图片的 mask 属性
                    if (imageNode.mask !== undefined) {
                        imageNode.mask = shapeLayer;
                    }
                } catch (e2) {
                    console.error('无法设置蒙版:', e2);
                }
            }
            
            console.log(`形状图层已设置为图片图层的蒙版`);
            
            console.log(`图片图层和形状图层已创建并居中对齐，形状图层设置为蒙版，图片 ${imageIndex + 1}/${currentShapeLayers.length} 处理完成`);
            
            // 检查是否所有图片都已处理
            // 注意：imageIndex 是从 0 开始的，所以最后一个索引是 length - 1
            const isLastImage = imageIndex === currentShapeLayers.length - 1;
            console.log(`图片 ${imageIndex + 1}/${currentShapeLayers.length} 处理完成，是否最后一张: ${isLastImage}`);
            
            if (isLastImage) {
                // 发送成功消息
                console.log('所有图层处理完成，发送成功消息');
                mg.ui.postMessage({ type: 'success', message: `成功创建${currentShapeLayers.length}个图片图层，形状图层已设置为蒙版` });
                if (mg.notify) {
                    mg.notify(`成功创建${currentShapeLayers.length}个图片图层，形状图层已设置为蒙版`);
                }
                console.log('成功消息已发送');
                // 清空图层引用
                currentShapeLayers = [];
            }
            
        } catch (error) {
            console.error(`处理图片数据失败 (index: ${imageIndex}):`, error);
            console.error('错误堆栈:', error.stack);
            
            // 即使出错，也检查是否所有图片都已处理
            const isLastImage = imageIndex === currentShapeLayers.length - 1;
            if (isLastImage) {
                mg.ui.postMessage({ type: 'error', message: `创建失败: ${error.message}` });
                if (mg.notify) {
                    mg.notify(`创建失败: ${error.message}`);
                }
                currentShapeLayers = [];
            } else {
                // 不是最后一张，继续处理下一张，但记录错误
                console.warn(`图片 ${imageIndex} 处理失败，但继续处理其他图片`);
            }
        }
    }
    
    // 处理图片下载错误
    if (actualMsg.type === 'image-error') {
        console.error(`图片 ${actualMsg.index} 下载失败:`, actualMsg.error);
        // 检查是否所有图片都已处理（包括失败的）
        // 这里我们只记录错误，不影响其他图片的处理
        // 如果所有图片都处理完成（包括失败的），会在最后一个 image-data 消息中处理
    }
}
