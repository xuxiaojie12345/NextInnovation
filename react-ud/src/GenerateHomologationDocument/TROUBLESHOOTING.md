# 页面跳转问题排查指南

## 问题现象
点击Submit按钮后，页面没有跳转到Generate Document页面

## 排查步骤

### 步骤1：打开浏览器开发者工具

按 **F12** 或右键点击页面选择"检查"，打开开发者工具。

### 步骤2：切换到Console标签页

在开发者工具顶部找到并点击 **Console** 标签。

### 步骤3：填写表单并点击Submit

确保填写以下字段：
- ✅ **Chassis series**: 输入任意值（如"JPCT"）
- ✅ **Chassis no**: 输入底盘号（如"013945"）
- ✅ **Document type**: 从下拉列表选择一个值（如"VIN_PLATE"）

然后点击 **Submit** 按钮。

### 步骤4：查看Console日志输出

#### 情况A：看到完整的日志输出

如果看到以下日志，说明代码执行正常：

```
========================================
handleSubmit called
========================================
chassisSeries: JPCT
chassisNo: 013945
documentType: VIN_PLATE
isLoading: false
========================================
Validating form...
chassisSeries trimmed: JPCT
chassisNo trimmed: 013945
documentType: VIN_PLATE
Validation passed!
✅ Validation passed, proceeding with submit...
 Saved to localStorage: {chassisSeries: "JPCT", chassisNo: "013945", documentType: "VIN_PLATE"}
🚀 Navigating to: /generate-document?chassisNo=013945
 Calling navigate...
✅ Navigate called successfully
========================================
```

**结果**：页面应该成功跳转

#### 情况B：看到"❌ Validation failed"

如果看到：
```
❌ Validation failed - Form submission stopped
```

**原因**：表单验证失败

**解决方法**：
1. 确认 **Chassis series** 已填写（不能为空）
2. 确认 **Chassis no** 已填写（不能为空）
3. 确认 **Document type** 已从下拉列表选择（不能是"Please select"）

#### 情况C：看到"❌ Navigate error"

如果看到：
```
❌ Navigate error: ...
🔄 Falling back to window.location.href
```

**原因**：React Router的navigate方法失败

**解决方法**：系统会自动使用window.location.href作为备用方案，页面仍会跳转

#### 情况D：没有任何日志输出

如果点击Submit后Console中没有任何日志：

**可能原因1**：按钮点击事件没有触发
- 检查按钮是否被禁用（disabled属性）
- 检查是否有其他元素遮挡了按钮

**可能原因2**：JavaScript错误阻止了执行
- 查看Console中是否有红色错误信息
- 刷新页面重试

### 步骤5：检查URL变化

点击Submit后，观察浏览器地址栏：

- **期望URL**: `http://localhost:3000/generate-document?chassisNo=013945`
- **当前URL**: `http://localhost:3000/generate-homologation-document`

如果URL没有变化，说明跳转失败。

### 步骤6：检查Network标签页

切换到 **Network** 标签页，查看是否有API请求：

1. 清空Network记录（点击🚫图标）
2. 点击Submit按钮
3. 查看是否有新的请求

如果有请求但失败了，查看：
- **状态码**: 应该是200或其他成功状态码
- **响应内容**: 查看是否有错误信息

## 常见问题解决

### 问题1：Document type下拉列表为空

**原因**：后端API服务未启动或API调用失败

**解决方法**：
1. 启动后端服务：
   ```bash
   cd api-ud
   mvn spring-boot:run
   ```
2. 或者使用备用数据（已自动实现）

### 问题2：页面仍然不跳转

**尝试以下操作**：

1. **清除浏览器缓存**：
   - 按 Ctrl+Shift+Delete（Windows）或 Cmd+Shift+Delete（Mac）
   - 选择"缓存的图片和文件"
   - 点击"清除数据"

2. **硬刷新页面**：
   - 按 Ctrl+F5（Windows）或 Cmd+Shift+R（Mac）

3. **使用无痕模式**：
   - 打开浏览器的无痕/隐私模式
   - 重新访问页面

4. **检查React Router版本**：
   ```bash
   npm list react-router-dom
   ```
   确保版本是 v6.x

5. **查看完整错误信息**：
   - 在Console中输入：`console.log(window.location)`
   - 查看当前页面的完整信息

## 调试技巧

### 手动测试跳转

在Console中直接执行以下命令测试跳转：

```javascript
// 测试navigate
window.history.pushState({}, '', '/generate-document?chassisNo=013945');
window.location.reload();
```

或者：

```javascript
// 直接跳转
window.location.href = '/generate-document?chassisNo=013945';
```

### 检查localStorage

在Console中执行：

```javascript
// 查看保存的搜索条件
console.log(localStorage.getItem('lastSearchConditions'));
```

应该看到类似：
```json
{"chassisSeries":"JPCT","chassisNo":"013945","documentType":"VIN_PLATE"}
```

## 联系支持

如果以上步骤都无法解决问题，请：

1. 截图Console中的完整日志输出
2. 截图Network标签页中的请求信息
3. 记录浏览器版本和操作系统
4. 发送邮件至：support.tpi@volvo.com

---

**最后更新**: 2026-05-21
