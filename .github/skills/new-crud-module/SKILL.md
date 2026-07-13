---
name: new-crud-module
description: '在 NextInnovation 项目中创建完整的 CRUD 模块（后端 + 前端）。自动生成 Controller、Service、Mapper、Entity、Mapper XML 以及包含列表/新增/编辑/详情页面的 React 组件。'
user-invocable: true
argument-hint: '实体名称（日文或英文），例如 "ユーザー管理" 或 "ProductMaster"'
---

# 新建 CRUD 模块

## 使用场景
- 新增主数据管理功能
- 需要标准的增/删/改/查/搜索功能
- 需要为数据库表同时提供后端 API 和前端页面

## 架构概览

```
api-ud/src/main/java/com/web/
├── controller/     → XxxController.java       (@RestController)
├── service/        → XxxService.java          (接口)
├── service/impl/   → XxxServiceImpl.java      (@Service)
├── mapper/         → XxxMapper.java           (@Mapper)
└── entity/         → Xxx.java                 (@Data, @Table)

api-ud/src/main/resources/mapper/
└── XxxMapper.xml                               (SQL)

react-ud/src/
└── XxxPage/
    ├── XxxPage.tsx                              (列表页面)
    ├── XxxCreate.tsx                            (新增/编辑表单)
    ├── XxxDetail.tsx                            (详情页面)
    └── XxxPage.css                              (样式)
```

## 操作步骤

### 步骤 1：确认需求
向用户确认以下信息：
- **表名** — 例如 `m_product`
- **画面显示名称** — 例如 "商品マスタ"
- **API 路径** — 例如 `/api/product`
- **主要字段** — 字段名、类型、是否必填、是否可搜索

### 步骤 2：创建后端（7 个文件）

#### 2a. 实体类 — `entity/Xxx.java`
```java
package com.web.entity;

import lombok.Data;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Data
@Table(name = "m_product")
public class Xxx {
    private Integer id;
    private String name;
    private String code;
    private Integer sortOrder;
    private String deleteFlag;
    private LocalDateTime createDate;
    private String createUser;
    private LocalDateTime updateDate;
    private String updateUser;
}
```

#### 2b. Mapper 接口 — `mapper/XxxMapper.java`
```java
package com.web.mapper;

import com.web.entity.Xxx;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface XxxMapper {
    List<Xxx> selectList(Xxx param);
    Xxx selectById(@Param("id") Integer id);
    int insert(Xxx entity);
    int update(Xxx entity);
    int deleteById(@Param("id") Integer id);
}
```

#### 2c. Mapper XML — `resources/mapper/XxxMapper.xml`
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.web.mapper.XxxMapper">
    <resultMap id="BaseResultMap" type="com.web.entity.Xxx">
        <id column="id" property="id" />
        <result column="name" property="name" />
        ...
    </resultMap>
    <sql id="BaseColumns">id, name, ...</sql>
    <select id="selectList" .../>
    <select id="selectById" .../>
    <insert id="insert" .../>
    <update id="update" .../>
    <delete id="deleteById" .../>
</mapper>
```

#### 2d. Service 接口 — `service/XxxService.java`
```java
package com.web.service;
import com.web.entity.Xxx;
import java.util.List;

public interface XxxService {
    List<Xxx> selectList(Xxx param);
    Xxx selectById(Integer id);
    int insert(Xxx entity);
    int update(Xxx entity);
    int deleteById(Integer id);
}
```

#### 2e. Service 实现 — `service/impl/XxxServiceImpl.java`
```java
package com.web.service.impl;
import com.web.entity.Xxx;
import com.web.mapper.XxxMapper;
import com.web.service.XxxService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class XxxServiceImpl implements XxxService {
    private final XxxMapper mapper;

    @Override
    public List<Xxx> selectList(Xxx param) { return mapper.selectList(param); }

    @Override
    public Xxx selectById(Integer id) { return mapper.selectById(id); }

    @Override
    public int insert(Xxx entity) { return mapper.insert(entity); }

    @Override
    public int update(Xxx entity) { return mapper.update(entity); }

    @Override
    public int deleteById(Integer id) { return mapper.deleteById(id); }
}
```

#### 2f. Controller — `controller/XxxController.java`
```java
package com.web.controller;

import com.web.entity.Xxx;
import com.web.service.XxxService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/xxx")
@RequiredArgsConstructor
public class XxxController {
    private final XxxService service;

    @GetMapping("/list")
    public ResponseEntity<List<Xxx>> list(Xxx param) { ... }

    @GetMapping("/{id}")
    public ResponseEntity<Xxx> detail(@PathVariable Integer id) { ... }

    @PostMapping("/add")
    public ResponseEntity<Void> add(@RequestBody Xxx entity) { ... }

    @PutMapping("/update")
    public ResponseEntity<Void> update(@RequestBody Xxx entity) { ... }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) { ... }
}
```

### 步骤 3：创建前端（4 个文件）

> 所有前端页面的用户界面标签必须使用**日文**。

在 `react-ud/src/XxxPage/` 下创建：

| 文件 | 用途 |
|------|------|
| `XxxPage.tsx` | 一覧画面 — 搜索表单 + 表格 + CRUD 按钮 |
| `XxxCreate.tsx` | 登録/編集画面 — 带验证的表单 |
| `XxxDetail.tsx` | 詳細画面 — 只读详情视图 |
| `XxxPage.css` | 样式文件 |

#### 前端关键模式
```tsx
// API 调用模式
import axios from '../api/axios';
const res = await axios.get('/api/xxx/list', { params });

// 表格模式（Ant Design 或原生 HTML 表格）
// 表单模式（React Hook Form 或受控组件）
// 成功/错误处理（alert 或 notification）
```

### 步骤 4：添加菜单和路由
- 在 `Menu.tsx` 中添加指向新页面的菜单项
- 在 `App.tsx` 中添加路由（如果使用 React Router）

### 步骤 5：验证
1. 启动后端：`mvn spring-boot:run`（在 `api-ud/` 目录下）
2. 启动前端：`npm start`（在 `react-ud/` 目录下）
3. 测试：新增 → 查询 → 编辑 → 删除 → 搜索

## 代码模板

参考以下模板文件获取样板代码：
- [后端模板](./scripts/templates/)
- [前端模板](./scripts/templates/)
