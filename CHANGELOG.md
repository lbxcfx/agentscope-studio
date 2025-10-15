# Changelog

All notable changes to AgentScope Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2025-10-15

#### 🚀 Friday Dual-Model Configuration (Text + Vision)

- **Separate Model Configuration**: Settings page now supports configuring both text and vision models independently
  - Renamed "Model Name" to "Language Model Name" for clarity
  - Added new "Vision Model Name" field for multimodal models
  - Allows simultaneous configuration of text-only and vision-capable models

- **Automatic Model Selection**: Backend intelligently switches between models based on input
  - Uses language model for text-only queries
  - Automatically switches to vision model when images are detected in input
  - Seamlessly switches back to language model after processing
  - Falls back to language model if vision model is not configured

- **Configuration Changes**:
  - `packages/shared/src/config/friday.ts`: Added optional `visionModelName` field
  - `packages/app/friday/args.py`: Added `--visionModelName` argument parser
  - `packages/app/friday/main.py`: Implemented dynamic model switching logic

- **UI/UX Improvements**:
  - Provider-specific help text for both language and vision models
  - Dynamic placeholders showing example model names for each provider
  - Separate recommendations for text models vs. multimodal models
  - Bilingual support (English/Chinese) for all new labels

- **Technical Implementation**:
  - Image detection function checks for image blocks with `source` field in content
  - Model switching occurs before agent processing
  - Clean model restoration after multimodal queries
  - ImageConverter passes blocks through as-is (AgentScope formatters handle conversion)
  - No breaking changes to existing configurations

### Added - 2025-10-14

#### 🎨 Friday Multimodal Image Understanding Feature

- **Image Upload Support**: Users can now upload images in the Friday chat interface
  - Support for multiple image formats (PNG, JPG, JPEG, GIF, WebP, BMP)
  - Multiple image upload capability
  - Image preview and management in the chat interface

- **Frontend Implementation** (`packages/client/src/components/chat/AppChatComponent/index.tsx`)
  - Automatic Base64 encoding for uploaded images
  - ImageBlock format construction with proper type definitions
  - Image removal and cleanup functionality
  - Integration with existing chat component architecture

- **Backend Processing** (`packages/app/friday/`)
  - `ImageConverter` utility class passes blocks through as-is
  - AgentScope formatters handle Base64/URL conversion natively
  - No temporary file creation needed (formatters handle it internally)
  - Simplified architecture with no manual cleanup required

- **Multimodal Model Support**
  - DashScope (Qwen-VL series: qwen-vl-max, qwen-vl-plus)
  - OpenAI (GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-4-vision-preview)
  - Anthropic (Claude 3 Opus, Sonnet, Haiku)
  - Google Gemini (gemini-pro-vision, gemini-1.5-pro)
  - Ollama (llava, bakllava, and other vision models)

- **Documentation**
  - `MULTIMODAL_CONFIG.md`: Comprehensive configuration guide for multimodal models
  - `QUICKSTART_MULTIMODAL.md`: 5-minute quick start guide
  - `TESTING_CHECKLIST.md`: Complete testing checklist for QA
  - `IMPLEMENTATION_SUMMARY.md`: Technical implementation details
  - Updated `README.md` with new feature announcement

### Technical Details

#### Data Flow
```
User Upload → Base64 Encoding → ImageBlock Construction →
Socket Transfer → Pass-through to AgentScope → Formatter Conversion →
LLM Analysis → Response
```

#### File Changes
- **New Files**:
  - `packages/app/friday/utils/image_converter.py`
  - `MULTIMODAL_CONFIG.md`
  - `QUICKSTART_MULTIMODAL.md`
  - `TESTING_CHECKLIST.md`
  - `IMPLEMENTATION_SUMMARY.md`
  - `CHANGELOG.md`

- **Modified Files**:
  - `packages/client/src/components/chat/AppChatComponent/index.tsx`
  - `packages/app/friday/main.py`
  - `README.md`

#### Security & Performance
- Async Base64 conversion to prevent UI blocking
- File type validation on upload
- Size limit recommendations (20MB per image)
- Direct Base64 pass-through reduces file I/O operations
- No temporary file cleanup needed

### Breaking Changes
None. This is a backward-compatible feature addition.

### Migration Guide
No migration needed. Existing configurations will continue to work for text-only conversations.

To enable multimodal support:
1. Configure a vision-capable model in Friday settings
2. Start uploading images and asking questions!

---

## [1.0.0] - 2025-08

### Added
- Initial release of AgentScope Studio
- Project management capabilities
- Runtime visualization
- Built-in Friday copilot assistant
- Tracing and evaluation features
- Integration with AgentScope framework

---

## Legend

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
