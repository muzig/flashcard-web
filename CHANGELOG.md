# 更新日志

所有项目的显著变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.1.0] - 2025-05-01

### 🎉 首次发布

- 基于 Vue 3 构建的交互式闪卡学习工具

### ✨ 新增功能

- 多主题学习支持（HTML/CSS、JavaScript、Vue.js、Rust、Golang、TypeScript、MySQL）
- 自定义闪卡功能，支持上传 TSV 文件创建个性化闪卡集
- 智能进度跟踪系统，自动记录学习进度
- 交互式学习界面，支持卡片翻转和键盘快捷键
- 响应式设计，适配桌面和移动设备

### 🔧 技术实现

- 使用 Vue 3 + Composition API 构建
- 集成 Pinia 状态管理
- 使用 Vue Router 实现路由
- 采用 Vite 作为构建工具

### 🐛 已知问题

- 在某些移动设备上，卡片翻转动画可能不够流畅
- 大型 TSV 文件导入可能需要较长时间