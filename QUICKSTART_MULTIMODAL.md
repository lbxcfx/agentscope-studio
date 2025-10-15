# 🚀 快速开始：Friday 图片理解功能

## 5 分钟快速上手指南

### 步骤 1: 安装依赖（如果还没有）

```bash
# 克隆仓库
git clone https://github.com/agentscope-ai/agentscope-studio
cd agentscope-studio

# 安装依赖
npm install
```

### 步骤 2: 启动 AgentScope Studio

```bash
# 开发模式
npm run dev

# 或者从 npm 安装后
as_studio
```

访问 `http://localhost:3000`

### 步骤 3: 配置 Friday

1. 在 AgentScope Studio 主页，点击 **Friday** 菜单
2. 点击右上角的 **设置图标** ⚙️
3. 填写配置信息：

#### 配置示例 1: 使用 OpenAI GPT-4o（推荐）

```
Python Environment: /usr/bin/python3  (或 Windows: C:\Python310\python.exe)
LLM Provider: openai
Model Name: gpt-4o
API Key: sk-your-openai-api-key-here
Write Permission: ☐ (根据需要勾选)
```

#### 配置示例 2: 使用阿里云通义千问

```
Python Environment: /usr/bin/python3
LLM Provider: dashscope
Model Name: qwen-vl-max
API Key: your-dashscope-api-key
Write Permission: ☐
```

#### 配置示例 3: 使用本地 Ollama

```bash
# 首先安装并启动 Ollama
ollama run llava
```

```
Python Environment: /usr/bin/python3
LLM Provider: ollama
Model Name: llava
Base URL: http://localhost:11434
API Key: ollama (任意非空值)
Write Permission: ☐
```

4. 点击 **Verify** 验证配置
5. 点击 **Save Config** 保存

### 步骤 4: 安装 Python 依赖

Friday 需要 AgentScope Python 库：

```bash
# 方法 1: 在设置页面点击 "Install Requirements" 按钮

# 方法 2: 手动安装
pip install agentscope[full]
```

### 步骤 5: 开始使用图片理解功能！

1. **返回 Friday 聊天页面**
   - 点击左上角的返回箭头或导航到 Friday Chat

2. **上传图片**
   - 点击输入框左侧的 **附件按钮** 📎
   - 选择一张图片（PNG, JPG, JPEG, GIF, WebP, BMP）
   - 图片会显示在输入框上方

3. **输入问题**
   ```
   这张图片中有什么内容？
   ```

4. **发送并等待回答**
   - 点击发送按钮或按 Enter
   - Friday 将分析图片并回答您的问题

## 💡 示例对话

### 示例 1: 图片描述

**上传**: 一张风景照片

**提问**: "请详细描述这张图片"

**Friday**: "这是一张美丽的自然风景照。画面中可以看到巍峨的山峦层叠起伏，山顶覆盖着白雪。前景是一片翠绿的草地，中间有一条蜿蜒的小溪..."

### 示例 2: 图片问答

**上传**: 一张包含文字的海报

**提问**: "图片中的标题是什么？"

**Friday**: "图片中的标题是'AgentScope Studio - 开发者友好的可视化工具'"

### 示例 3: 多图片对比

**上传**: 两张猫的照片

**提问**: "这两只猫有什么不同？"

**Friday**: "第一张照片中的猫是橘色的短毛猫，而第二张照片中的猫是黑白相间的长毛猫。它们的体型、毛色和毛长都明显不同..."

## 🎨 进阶技巧

### 1. 批量分析图片

上传多张图片，然后问：
```
请总结这些图片的共同主题
```

### 2. 图片 OCR

上传包含文字的图片：
```
请提取图片中所有的文字内容
```

### 3. 图片对象识别

```
图片中有多少个人？他们在做什么？
```

### 4. 图片风格分析

```
这张图片是什么风格的？给我一些关键词
```

## 🔧 故障排查

### 问题: 上传图片后没有反应

**解决方案**:
1. 检查浏览器控制台是否有错误信息
2. 确认图片格式支持（PNG, JPG, JPEG, GIF, WebP, BMP）
3. 确认图片大小不超过 20MB

### 问题: Friday 回答时没有提到图片内容

**解决方案**:
1. 确认配置的模型支持视觉能力（参考配置示例）
2. 检查 API Key 是否正确
3. 查看终端或日志是否有错误信息
4. 尝试重新保存配置

### 问题: Python 环境找不到

**解决方案**:
```bash
# 找到 Python 路径
which python3  # Linux/Mac
where python   # Windows

# 或者
python3 --version
```

将输出的路径填入 "Python Environment" 字段

### 问题: 模型 API 调用失败

**解决方案**:
1. 检查网络连接
2. 确认 API Key 有足够的配额
3. 对于 OpenAI，确认 API Key 有访问 GPT-4V/GPT-4o 的权限
4. 对于 Ollama，确认服务正在运行：`ollama list`

## 📚 相关文档

- **完整配置指南**: [MULTIMODAL_CONFIG.md](./MULTIMODAL_CONFIG.md)
- **测试清单**: [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
- **实现细节**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

## 🎉 开始享受 Friday 的图片理解能力吧！

如果遇到问题，请查阅上述文档或提交 Issue。

---

**祝您使用愉快！** 🌟
