// 用于展示插件用户界面
console.log('插件初始化开始...');
mg.showUI(__html__)
console.log('插件UI已显示');

// 保存当前处理的图层引用，避免异步处理时选中状态丢失
let currentShapeLayers = [];
// 保存形状样式信息（尺寸、圆角、类型等）
let shapeStyles = [];

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
        
        // 过滤出形状图层（排除文本图层）并提取样式信息
        const shapeLayers = [];
        const styles = [];
        
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
                        
                        // 提取形状样式信息
                        const style = {
                            type: nodeType, // RECTANGLE, ELLIPSE 等
                            width: node.width || 120,
                            height: node.height || 120,
                            x: node.x || 0,
                            y: node.y || 0,
                            cornerRadius: node.cornerRadius || 0, // 圆角半径（仅矩形）
                            fills: node.fills ? JSON.parse(JSON.stringify(node.fills)) : []
                        };
                        styles.push(style);
                        
                        console.log(`添加形状图层 ${i}，类型: ${nodeType}，尺寸: ${style.width}×${style.height}`);
                    }
                }
            } catch (e) {
                console.log('处理节点时出错:', e.message);
            }
        }
        
        console.log('筛选后的形状图层数量:', shapeLayers.length);
        return { layers: shapeLayers, styles: styles };
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
            // 1. 获取选中的形状图层和样式信息
            const result = getSelectedShapeLayers();
            const shapeLayers = result.layers;
            const styles = result.styles;
            
            if (shapeLayers.length === 0) {
                mg.ui.postMessage({ type: 'error', message: '请先选中形状图层（矩形、圆形等）' });
                if (mg.notify) {
                    mg.notify('请先选中形状图层（矩形、圆形等）');
                }
                return;
            }
            
            // 保存图层引用和样式信息
            currentShapeLayers = shapeLayers;
            shapeStyles = styles;
            
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
        console.log('请求UI下载图片数据...');
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
            // 使用保存的图层引用，而不是重新获取
            const imageDataArray = actualMsg.imageData; // 普通数组
            const fillMode = actualMsg.fillMode || 'FILL';
            const imageIndex = actualMsg.index || 0;
            
            if (!currentShapeLayers || currentShapeLayers.length === 0) {
                console.error('图层引用已丢失');
                mg.ui.postMessage({ type: 'error', message: '图层引用已丢失，请重新选择图层并重试' });
                return;
            }
            
            if (imageIndex >= currentShapeLayers.length || imageIndex >= shapeStyles.length) {
                console.log('图片索引超出范围:', imageIndex);
                return;
            }
            
            const referenceLayer = currentShapeLayers[imageIndex];
            const style = shapeStyles[imageIndex];
            
            // 获取当前页面和父容器
            const currentPage = mg.document.currentPage;
            const parent = referenceLayer.parent || currentPage;
            
            // 将普通数组转换为 Uint8Array
            const imageData = new Uint8Array(imageDataArray);
            
            // 创建图片对象
            console.log(`创建图片 ${imageIndex}，数据长度: ${imageData.length}`);
            const imageHandle = await mg.createImage(imageData);
            
            // 获取参考图层的尺寸和位置（默认 120×120px）
            const imageWidth = style.width || 120;
            const imageHeight = style.height || 120;
            const imageX = style.x || 0;
            const imageY = style.y || 0;
            
            console.log(`创建图片图层，尺寸: ${imageWidth}×${imageHeight}，位置: (${imageX}, ${imageY})`);
            
            // 1. 创建图片图层（使用矩形填充图片的方式）
            const imageNode = mg.createRectangle();
            imageNode.x = imageX;
            imageNode.y = imageY;
            imageNode.width = imageWidth;
            imageNode.height = imageHeight;
            
            // 设置图片填充
            imageNode.fills = [{
                type: 'IMAGE',
                scaleMode: fillMode,
                imageRef: imageHandle.href
            }];
            
            console.log(`图片图层创建成功`);
            
            // 2. 创建形状蒙版图层（根据参考图层的类型）
            console.log(`创建形状蒙版图层，类型: ${style.type}`);
            let maskNode;
            
            if (style.type === 'ELLIPSE' || style.type === 'ellipse') {
                // 创建圆形
                maskNode = mg.createEllipse();
            } else {
                // 创建矩形（含圆角）
                maskNode = mg.createRectangle();
                if (style.cornerRadius && style.cornerRadius > 0) {
                    maskNode.cornerRadius = style.cornerRadius;
                }
            }
            
            // 设置形状图层的位置和尺寸（与图片图层相同）
            maskNode.x = imageX;
            maskNode.y = imageY;
            maskNode.width = imageWidth;
            maskNode.height = imageHeight;
            
            // 设置形状图层为蒙版
            maskNode.isMask = true;
            
            console.log(`形状蒙版图层创建成功`);
            
            // 3. 创建组并将图片和形状添加到组中
            console.log(`创建蒙版组`);
            const group = mg.createFrame();
            group.x = imageX;
            group.y = imageY;
            group.width = imageWidth;
            group.height = imageHeight;
            
            // 将图片和形状添加到组中（图片在下，形状在上）
            group.appendChild(imageNode);
            group.appendChild(maskNode);
            
            // 设置蒙版关系
            group.clipsContent = true;
            if (maskNode.setAsMask) {
                maskNode.setAsMask();
            }
            
            // 将组添加到父容器
            parent.appendChild(group);
            
            console.log(`蒙版组创建成功，图片 ${imageIndex + 1}/${currentShapeLayers.length} 处理完成`);
            
            // 检查是否所有图片都已处理
            // 注意：imageIndex 是从 0 开始的，所以最后一个索引是 length - 1
            const isLastImage = imageIndex === currentShapeLayers.length - 1;
            console.log(`图片 ${imageIndex + 1}/${currentShapeLayers.length} 处理完成，是否最后一张: ${isLastImage}`);
            
            if (isLastImage) {
                // 发送成功消息
                console.log('所有图层填充完成，发送成功消息');
                mg.ui.postMessage({ type: 'success', message: `成功创建${currentShapeLayers.length}个图片蒙版组` });
                if (mg.notify) {
                    mg.notify(`成功创建${currentShapeLayers.length}个图片蒙版组`);
                }
                console.log('成功消息已发送');
                // 清空图层引用和样式
                currentShapeLayers = [];
                shapeStyles = [];
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
                shapeStyles = [];
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
