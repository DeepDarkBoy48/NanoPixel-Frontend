# 设计文档

## 概述

本设计解决了前端魔法修图组件与后端API之间的不匹配问题。后端期望 `originFile` 和 `file` 两个参数，但当前前端实现只发送一个文件。解决方案涉及更新提交处理程序中的FormData构造，以包含两个必需的参数。

## 架构

修复涉及对现有Vue.js组件架构的最小更改：

- **组件层**: `magicImageEdit.vue` - 更新 `onSubmit` 方法
- **API层**: `ai.js` - 无需更改（已正确构建）
- **后端集成**: 确保FormData匹配预期的API契约

## 组件和接口

### 前端组件更改

**文件**: `src/views/ai/magicImageEdit.vue`

**当前实现**:
```javascript
const onSubmit = async () => {
    // ... 验证逻辑
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('prompt', prompt.value.trim())
    // ... API调用
}
```

**更新后实现**:
```javascript
const onSubmit = async () => {
    // ... 验证逻辑
    const formData = new FormData()
    formData.append('originFile', selectedFile.value)  // 原始文件
    formData.append('file', selectedFile.value)        // 用于处理的同一文件
    formData.append('prompt', prompt.value.trim())
    // ... API调用
}
```

### API接口

**后端端点**: `POST /ai/imageEdit`

**预期参数**:
- `originFile`: MultipartFile - 原始上传的图片
- `file`: MultipartFile - 用于处理的图片文件（可以与originFile相同）
- `prompt`: String - AI编辑的文本提示
- `model`: String（可选）- 要使用的AI模型

## 数据模型

### FormData结构

```javascript
FormData {
    originFile: File,    // 用户上传的图片文件
    file: File,          // 同一文件（或潜在的预处理版本）
    prompt: String,      // 用户的编辑指令
    model?: String       // 可选的模型参数
}
```

### 文件处理

- **输入**: 用户通过 `el-upload` 组件选择的单个文件
- **处理**: 对 `originFile` 和 `file` 参数使用同一文件
- **验证**: 确保文件存在且提示词在提交前不为空

## 错误处理

### 客户端验证

1. **文件验证**: 确保 `selectedFile.value` 在提交前存在
2. **提示词验证**: 确保 `prompt.value.trim()` 不为空
3. **大小验证**: 维护现有文件大小限制（UI中建议10MB）

### API错误处理

1. **网络错误**: 显示用户友好的错误消息
2. **验证错误**: 显示特定字段相关的错误
3. **服务器错误**: 提供备用错误消息
4. **超时处理**: 处理长时间运行的AI处理请求

### 错误状态

```javascript
try {
    const res = await imageEditService(formData)
    resultUrl.value = typeof res.data === 'string' ? res.data : (res.data?.url || '')
} catch (error) {
    // 增强的错误处理
    if (error.response?.status === 400) {
        ElMessage.error('请检查上传的图片和提示词')
    } else if (error.response?.status === 413) {
        ElMessage.error('图片文件过大，请选择较小的文件')
    } else {
        ElMessage.error('处理失败，请稍后重试')
    }
    console.error('Image edit error:', error)
}
```

## 测试策略

### 单元测试

1. **FormData构造**: 测试FormData包含正确的参数
2. **文件处理**: 测试文件选择和验证逻辑
3. **错误场景**: 测试各种错误条件和用户反馈

### 集成测试

1. **API通信**: 使用模拟后端测试实际API调用
2. **文件上传流程**: 测试从文件选择到结果显示的完整用户工作流程
3. **错误处理**: 测试API错误响应和用户反馈

### 手动测试场景

1. **正常路径**: 选择图片 → 输入提示词 → 提交 → 查看结果
2. **验证错误**: 不选择文件提交，不输入提示词提交
3. **大文件**: 测试文件大小限制和错误处理
4. **网络问题**: 测试离线/慢连接场景
5. **API错误**: 测试各种后端错误响应

## 实现说明

### 向后兼容性

- 更改是向后兼容的，因为它只添加了缺失的 `originFile` 参数
- 现有功能保持不变
- 用户界面无破坏性更改

### 性能考虑

- 发送同一文件两次会增加上传大小，但这符合后端API契约
- 考虑未来优化，其中 `file` 可以是处理/调整大小的版本
- 维护现有文件大小验证以防止过度上传

### 未来增强

1. **文件预处理**: 可能调整大小或优化 `file` 参数，同时保持 `originFile` 完整
2. **进度指示器**: 为大文件添加上传进度
3. **重试逻辑**: 为失败的上传实现自动重试
4. **缓存**: 缓存成功的结果以避免重新处理相同的请求