# Generate Document (UD04) - 快速开始指南

## 5分钟快速上手

### 步骤1: 启动后端服务

```bash
cd api-ud
mvn spring-boot:run
```

确保后端服务在 http://localhost:8081 运行

### 步骤2: 启动前端服务

```bash
cd react-ud
npm install
npm start
```

前端服务将在 http://localhost:3000 启动

### 步骤3: 登录系统

1. 访问 http://localhost:3000
2. 输入用户名和密码
3. 点击登录

### 步骤4: 进入Generate Homologation Document页面

1. 从菜单中选择"Generate Homologation Document"
2. 填写以下信息：
   - **Chassis series**: JPCT（示例）
   - **Chassis no**: 013945（示例）
   - **Document type**: 从下拉列表选择
3. 点击**Submit**按钮

### 步骤5: 查看文档信息

页面将自动显示：
- ✅ 底盘基本信息（系列号、编号、订单号等）
- ✅ S-Note信息和轮胎数据
- ✅ ADCA变更状态（如有）
- ✅ 模板信息和替换参数
- ✅ 文档下载链接
- ✅ 系统时间和版本号

### 步骤6: 下载文档

点击**Generated document**链接，浏览器将自动下载.trf文件

### 步骤7: 修改文档（如需要）

如果ADCA变更激活：
1. 页面会显示红色警告："After def change detected. Document need to be modified."
2. 点击红色的**Modify Doc**链接
3. 跳转到修改文档页面进行编辑

---

## 常见问题

### Q1: 页面显示"Chassis not found"？
**A**: 检查底盘号是否正确，或联系管理员确认数据是否存在

### Q2: 看不到Modify Doc链接？
**A**: 只有当ADCA变更激活时才会显示该链接

### Q3: 下载的.trf文件如何打开？
**A**: 需要使用专门的软件，请联系管理员获取

### Q4: 页面加载很慢？
**A**: 
- 检查网络连接
- 确认后端服务是否正常运行
- 清除浏览器缓存后重试

---

## 下一步

-  查看[详细使用说明](./USAGE.md)
- 📋 查看[详细设计文档](./README.md)
-  查看[更新日志](./CHANGELOG.md)
- 🧪 运行单元测试: `npm test -- GenerateDocument`

---

## 技术支持

如有问题，请联系：
- **邮箱**: support.tpi@volvo.com
- **模块编号**: UD04

---

**最后更新**: 2026-05-21
