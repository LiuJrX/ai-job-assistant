# AI 找工作助手 (Python 后端版)

这是一个基于 AI 驱动的自动化求职工具，旨在帮助求职者（特别是开发者）高效地在各大招聘平台（如 BOSS直聘、猎聘等）搜索并投递简历。

## 🌟 项目特点

- **Python 核心驱动**: 后端采用 Python + FastAPI 构建，逻辑清晰且易于扩展。
- **现代化依赖管理**: 使用 `uv` 进行极速的依赖安装与环境管理。
- **AI 智能过滤**: 集成 Gemini / GPT 模型，自动分析职位描述 (JD) 与个人画像的匹配度。
- **自动化操作**: 基于 Playwright 实现浏览器自动化操作，模拟真实用户行为。
- **精致前端**: 使用 React + TypeScript + Tailwind CSS 打造的现代化深色系管理界面。

## 🏗️ 架构说明

- **前端 (`/src`)**: 
  - **框架**: React 19 + Vite
  - **样式**: Tailwind CSS (v4)
  - **动画**: Motion
  - **图标**: Lucide React
- **后端 (`/backend`)**:
  - **框架**: FastAPI
  - **管理器**: uv (配置位于 `pyproject.toml`)
  - **逻辑**: Playwright 自动化 + Google Gemini AI 匹配

## 🚀 快速开始

### 1. 环境准备
- Node.js (建议 v18+)
- Python 3.10+
- [uv](https://github.com/astral-sh/uv) (推荐)

### 2. 安装依赖

**前端:**
```bash
npm install
```

**后端:**
```bash
cd backend
uv sync
```

### 3. 配置环境变量
在根目录创建 `.env` 文件并填入：
```env
GEMINI_API_KEY="您的_API_KEY"
```

### 4. 启动项目

**开发模式 (Vite + Node Server):**
```bash
npm run dev
```

## 🛠️ 主要功能

- **职位搜索**: 支持关键词、城市、平台的多维度筛选。
- **AI 配置**: 可自定义匹配敏感度、回复语气及模型参数。
- **个人中心**: 集中管理简历 (PDF) 与 AI 提取的专业画像。
- **实时日志**: 监控自动化脚本的每一步操作。

## 📜 声明
本项目仅供学习与技术研究使用，请务必遵守相关招聘平台的开发者规范与使用协议。
