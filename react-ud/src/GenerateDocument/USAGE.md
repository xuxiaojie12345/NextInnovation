# Generate Document (UD04) - 使用说明

## 快速开始

### 1. 前置条件

确保以下服务已启动：
- 后端API服务（http://localhost:8081）
- 前端开发服务器（npm start）

### 2. 访问流程

#### 方式一：从Generate Homologation Document页面进入

1. 访问登录页面并登录
2. 进入菜单页面
3. 选择"Generate Homologation Document"功能
4. 填写以下信息：
   - **Chassis series**: 底盘系列号（最多5字符）
   - **Chassis no**: 底盘编号（最多10字符）
   - **Document type**: 文档类型（从下拉列表选择）
5. 点击**Submit**按钮
6. 自动跳转到Generate Document页面

#### 方式二：直接访问

访问URL：`http://localhost:3000/generate-document?chassisNo={底盘号}`

例如：`http://localhost:3000/generate-document?chassisNo=013945`

### 3. 页面功能

#### 3.1 显示的信息

页面会自动显示以下信息：

**基本信息**
- Chassis series: 底盘系列号
- Chassis no: 底盘编号
- Ordernumber: 订单号
- Build week: 构建周次
- Spec week: 规格周次
- Market: 市场
- Master Market: 主市场（固定显示为-EU）

**S-Note信息**
- S-Note NO: S-Note编号
- S-Note Message: 若存在S-Note信息，显示红色提示"The S-Notes above can affect homologation documents."

**轮胎信息**
- Load index: 载重指数

**ADCA变更信息**
- 若ADCA变更激活（ACT="Y"），显示红色警告："After def change detected. Document need to be modified."
- Modify Doc链接（红色可点击）
- Replacing parameters: 替换参数信息

**模板信息**
- Using template: 使用的模板名称

**文档下载**
- Generated document: 点击下载.trf文件

**系统信息**
- Date: 服务器当前时间（格式：YYYY-MM-DD HH:MM:SS）
- HDoc version: 程序版本号

#### 3.2 可操作功能

**Analyze Rules链接**
- 点击后在新窗口打开分析规则详情页面
- URL: `/analyze-rules`

**Modify Doc链接**（仅当ADCA变更激活时显示）
- 文字颜色为红色
- 点击后跳转到修改文档页面
- URL: `/modify-document?chassisNo={底盘号}`

**Generated document链接**
- 点击后下载.trf文件
- 文件名格式：`VIN_PLATE_{底盘号}.trf`

### 4. 错误处理

#### 4.1 常见错误消息

| 错误消息 | 原因 | 解决方法 |
|---------|------|---------|
| Chassis number is required. | 未提供底盘号 | 从Generate Homologation Document页面重新提交，或直接在URL中添加chassisNo参数 |
| Chassis not found | 底盘号不存在 | 检查底盘号是否正确，或联系管理员确认数据是否存在 |
| System error. Please contact administrator. | 系统错误或网络问题 | 检查网络连接，刷新页面重试，或联系管理员 |
| Document file not found | 文档文件不存在 | 联系管理员确认文件是否已生成 |

#### 4.2 调试方法

1. 打开浏览器开发者工具（F12）
2. 查看Console标签页的错误日志
3. 查看Network标签页的API请求和响应
4. 记录错误信息并联系开发人员

### 5. 注意事项

1. **用户认证**: 必须先登录才能访问此页面
2. **底盘号来源**: 底盘号从URL参数或localStorage获取
3. **ADCA变更状态**: 
   - ACT="Y": 变更激活，显示红色警告和可点击链接
   - ACT="N": 变更非激活，不显示警告和链接
4. **S-Note提示**: 仅当存在S-Note信息时显示红色提示消息
5. **文件下载**: 确保浏览器允许下载.trf文件类型

### 6. 浏览器兼容性

支持的浏览器：
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

### 7. 响应式设计

- **桌面端**: 完整显示所有信息
- **移动端**（宽度<768px）: 
  - 字体大小自动调整
  - 布局自适应
  - 保持所有功能可用

### 8. 性能优化建议

1. **API缓存**: 考虑对相同底盘号的查询结果进行缓存
2. **懒加载**: 对于大量数据，可以考虑分页或虚拟滚动
3. **图片优化**: 如果有图片资源，使用适当的压缩和格式

### 9. 常见问题解答

**Q1: 为什么看不到Modify Doc链接？**
A: 只有当ADCA变更状态为激活（ACT="Y"）时才会显示该链接。

**Q2: 下载的.trf文件如何打开？**
A: .trf文件是特定格式的文档文件，需要使用专门的软件打开。请联系管理员获取相关软件。

**Q3: 如何查看历史文档？**
A: 当前版本不支持历史文档查看功能。如需此功能，请联系开发团队。

**Q4: 页面加载很慢怎么办？**
A: 
- 检查网络连接是否正常
- 确认后端API服务是否正常运行
- 清除浏览器缓存后重试
- 联系管理员检查服务器性能

### 10. 技术支持

如有问题，请联系：
- **邮箱**: support.tpi@volvo.com
- **模块编号**: UD04
- **负责人**: 开发团队

### 11. 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0 | 2026-05-21 | 初始版本发布 |

---

**最后更新**: 2026-05-21
