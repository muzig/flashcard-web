# 闪卡学习应用 v0.1.0 发布说明

## 🎉 首次发布

我们很高兴发布闪卡学习应用的第一个版本！这是一个基于 Vue 3 构建的交互式闪卡学习工具，旨在帮助用户高效记忆和学习各类知识点。

## ✨ 核心功能

- **多主题学习**：预设多个学习主题（HTML/CSS、JavaScript、Vue.js、Rust、Golang、TypeScript、MySQL）
- **自定义闪卡**：支持上传自定义 TSV 文件创建个性化闪卡集
- **智能进度跟踪**：自动记录学习进度，支持中断后继续学习
- **交互式学习**：点击卡片翻转查看答案，支持键盘快捷键
- **响应式设计**：适配桌面和移动设备

## 🔧 技术栈

- Vue 3 + Composition API
- Pinia 状态管理
- Vue Router
- Vite 构建工具

## 📝 使用指南

### 开始学习
1. 在主页选择学习主题或上传自定义 TSV 文件
2. 点击卡片翻转查看答案
3. 使用键盘快捷键快速导航：
   - 左箭头：上一张卡片
   - 右箭头：下一张卡片
   - 空格键/回车键：翻转卡片

### 创建自定义闪卡
1. 准备 TSV 格式文件（类别、问题、答案）
2. 在主页选择"自定义主题"并上传文件

## 🔜 即将推出

根据我们的产品路线图，以下功能正在开发中：
- 闪卡标记系统（简单/中等/困难）
- 批量导入/导出功能
- 搜索功能
- 暗色模式

## 🐛 已知问题

- 在某些移动设备上，卡片翻转动画可能不够流畅
- 大型 TSV 文件导入可能需要较长时间

## 🙏 反馈与贡献

欢迎通过 GitHub Issues 提交问题报告或功能建议！