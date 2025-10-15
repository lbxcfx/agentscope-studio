# Friday 多模态图片理解功能配置指南

## 功能概述

Friday 应用现已支持图片理解功能。用户可以上传图片并在对话框中询问关于图片的问题，Friday 会调用多模态大模型进行回答。

## 配置要求

### 1. 支持的模型提供商和模型

要使用图片理解功能，您需要配置支持视觉能力的多模态模型。以下是支持的提供商及其推荐模型：

#### DashScope (阿里云通义千问)
- **推荐模型**：
  - `qwen-vl-max` - Qwen VL 系列的最强视觉理解模型
  - `qwen-vl-plus` - 性能与成本平衡的视觉模型
  - `qwen-vl-max-0809` (Qwen2-VL-72B) - 最新的大规模视觉语言模型

- **配置示例**：
  ```json
  {
    "llmProvider": "dashscope",
    "modelName": "qwen-vl-max",
    "apiKey": "your-dashscope-api-key"
  }
  ```

#### OpenAI
- **推荐模型**：
  - `gpt-4o` - 最新的多模态模型，性能优异
  - `gpt-4o-mini` - 轻量级版本，成本更低
  - `gpt-4-turbo` - 支持视觉的 GPT-4 版本
  - `gpt-4-vision-preview` - GPT-4 视觉预览版

- **配置示例**：
  ```json
  {
    "llmProvider": "openai",
    "modelName": "gpt-4o",
    "apiKey": "your-openai-api-key"
  }
  ```

#### Anthropic (Claude)
- **推荐模型**：
  - `claude-3-opus-20240229` - 最强大的多模态模型
  - `claude-3-sonnet-20240229` - 平衡性能与成本
  - `claude-3-haiku-20240307` - 快速且经济的选择

- **配置示例**：
  ```json
  {
    "llmProvider": "anthropic",
    "modelName": "claude-3-opus-20240229",
    "apiKey": "your-anthropic-api-key"
  }
  ```

#### Google Gemini
- **推荐模型**：
  - `gemini-pro-vision` - Gemini 视觉模型
  - `gemini-1.5-pro` - 最新的多模态模型

- **配置示例**：
  ```json
  {
    "llmProvider": "gemini",
    "modelName": "gemini-1.5-pro",
    "apiKey": "your-google-api-key"
  }
  ```

#### Ollama (本地部署)
- **推荐模型**：
  - `llava` - 开源的视觉语言模型
  - `bakllava` - 基于 LLaVA 的改进版本
  - 其他支持视觉的本地模型

- **配置示例**：
  ```json
  {
    "llmProvider": "ollama",
    "modelName": "llava",
    "baseUrl": "http://localhost:11434"
  }
  ```

### 2. 在 Friday 设置页面配置

1. 打开 AgentScope Studio
2. 导航到 Friday 页面
3. 点击右上角的设置图标
4. 在设置页面中填写：
   - **Python Environment**: Python 解释器路径（需要 Python 3.10+）
   - **LLM Provider**: 选择上述支持的提供商之一
   - **Model Name**: 输入支持视觉的模型名称
   - **API Key**: 输入对应提供商的 API 密钥
   - **Base URL** (可选): 对于 OpenAI 兼容接口或 Ollama
   - **Write Permission**: 是否允许 Friday 写入文件

5. 点击 "Save Config" 保存配置

## 使用方法

### 基本使用流程

1. **上传图片**：
   - 在 Friday 对话框中，点击输入框左侧的附件按钮（📎）
   - 选择要上传的图片文件（支持 PNG, JPG, JPEG, GIF, WebP, BMP）
   - 图片将显示在输入框上方的预览区域

2. **输入问题**：
   - 在文本输入框中输入您想问的关于图片的问题
   - 例如："这张图片中有什么内容？"、"请描述图片中的场景"

3. **发送并获取回答**：
   - 点击发送按钮或按 Enter 键
   - Friday 将调用配置的多模态模型分析图片并回答您的问题

4. **管理图片**：
   - 点击图片预览右上角的 ❌ 可以删除图片
   - 可以同时上传多张图片进行批量分析

### 使用示例

**示例 1: 图片描述**
- 上传：一张风景照片
- 问题："请详细描述这张图片中的景色"
- 回答：模型将分析并描述图片中的山川、河流、天空等元素

**示例 2: 图片问答**
- 上传：一张包含文字的图片
- 问题："图片中的文字内容是什么？"
- 回答：模型将识别并提取图片中的文字

**示例 3: 多图片对比**
- 上传：两张不同的图片
- 问题："这两张图片有什么区别？"
- 回答：模型将对比并说明两张图片的不同之处

## 技术细节

### 数据处理流程

1. **前端**：
   - 用户上传图片后，前端将图片转换为 Base64 编码
   - 创建 `ImageBlock` 对象，格式为：
     ```typescript
     {
       type: "image",
       source: {
         type: "base64",
         media_type: "image/png",
         data: "<base64-encoded-data>"
       }
     }
     ```

2. **后端转换**：
   - Python 后端接收 Base64 编码的图片
   - `ImageConverter` 将 Base64 数据解码并保存为临时文件
   - 转换为 AgentScope 格式：
     ```python
     {
       "type": "image",
       "url": "/path/to/temp/image.png"
     }
     ```

3. **模型调用**：
   - AgentScope 将转换后的消息发送给配置的多模态模型
   - 模型处理图片和文本问题，返回回答

4. **清理**：
   - 对话结束后，临时文件自动清理

### 支持的图片格式

- PNG (.png)
- JPEG (.jpg, .jpeg)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)

### 图片大小限制

- 建议单张图片大小不超过 20MB
- Base64 编码后的数据会增大约 33%
- 过大的图片可能导致处理时间延长

## 常见问题

### Q1: 为什么我上传图片后模型没有回应图片内容？

**A**: 请检查以下几点：
1. 确认您配置的模型支持视觉能力（参见上方推荐模型列表）
2. 检查 API 密钥是否正确
3. 查看浏览器控制台是否有错误信息

### Q2: 支持同时上传多张图片吗？

**A**: 是的，您可以同时上传多张图片。模型会分析所有上传的图片并回答您的问题。

### Q3: 临时文件存储在哪里？

**A**: 临时文件存储在系统默认的临时目录（由 Python 的 `tempfile.gettempdir()` 决定）。对话结束后，这些文件会自动清理。

### Q4: 如何切换到其他多模态模型？

**A**: 在 Friday 设置页面中，修改 "LLM Provider" 和 "Model Name" 字段，然后保存配置即可。下次对话将使用新配置的模型。

### Q5: 本地部署的 Ollama 模型需要特殊配置吗？

**A**: 需要在设置中填写 "Base URL" 字段，通常为 `http://localhost:11434`。确保 Ollama 服务正在运行，并且已经下载了支持视觉的模型（如 `llava`）。

## 安全性注意事项

1. **API 密钥安全**：
   - 不要在公共场合分享您的 API 密钥
   - 定期更换 API 密钥
   - 使用环境变量存储敏感信息

2. **图片隐私**：
   - 上传的图片会被发送到配置的模型提供商
   - 临时文件在本地存储，对话结束后自动删除
   - 不要上传包含敏感信息的图片

3. **成本控制**：
   - 大部分多模态模型按使用量计费
   - 图片分析通常比纯文本对话成本更高
   - 建议在提供商平台设置使用限额

## 更新日志

### v1.0.0 (2025-10-14)
- ✅ 添加图片上传功能
- ✅ 实现前端 Base64 编码
- ✅ 后端格式转换和临时文件管理
- ✅ 支持 5 个主流模型提供商
- ✅ 自动清理临时文件

## 支持与反馈

如果您在使用过程中遇到问题或有改进建议，请：
- 提交 Issue: https://github.com/agentscope-ai/agentscope-studio/issues
- 查看文档: https://doc.agentscope.io/
- 加入社区讨论

---

**享受使用 Friday 的多模态图片理解功能！** 🎉
