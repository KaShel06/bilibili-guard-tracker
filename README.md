### start tracker

git branch -M main

git remote add origin https://github.com/KaShel06/bilibili-guard-tracker.git

git push -u origin main

npm i -g vercel

vercel link

vercel env pull .env.local

- 创建核心库 ：将重复逻辑抽象到核心库中
- 统一 API 调用 ：创建 API 客户端统一处理请求
- 实现全局状态管理 ：使用 Context API 或 Redux 管理全局状态
- 组件抽象 ：将重复组件抽象为基础组件和高阶组件
- 统一错误处理 ：创建统一的错误处理机制
- 代码模块化 ：按功能而非页面组织代码
- 添加自动化测试 ：为核心功能添加单元测试和集成测试

## 1. 组件复用问题
### 发现的问题
- StreamerCard 和 PublicStreamerCard 有大量重复代码
- 标签管理逻辑在多个组件中重复实现
- API 调用模式在各个组件中重复
## 2. API 调用模式
### 发现的问题
- 每个组件都直接调用 fetch ，导致 API 调用逻辑分散
- 错误处理模式重复
- 缺乏统一的数据加载状态管理
## 3. 状态管理
### 发现的问题
- 状态逻辑分散在各个组件中
- 相同数据在不同组件
## 4. 表单处理
### 发现的问题
- 表单逻辑在多个组件中重复
- 验证逻辑不一致
## 5. 路由处理
### 发现的问题
- API 路由中有重复的权限检查逻辑
- 错误处理不一致
## . 数据库操作
### 发现的问题
- 数据库操作分散在多个文件中
- 缺乏统一的错误处理
## 7. 国际化
### 发现的问题
- 硬编码的中文和英文文本混合使用
- 缺乏统一的文本管理