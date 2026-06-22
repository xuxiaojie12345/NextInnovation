package com.web.app.domain.Entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * HDoc Document List Entity
 * 对应 UD17 用户管理功能请求/响应实体
 */
@Data
public class HdocDocumentList {
    // 查询参数
    private String userId;
    private String userName;

    // 用户信息
    private String userid;
    private String username;
    private String responsible;
    private String userposition;
    private String email;

    // 权限信息
    private List<Map<String, String>> functions;
    private List<Map<String, String>> markets;

    // 更新/删除参数
    private String market;
    @JsonProperty("type")
    private String type;
    private String bu;
    @JsonProperty("function")
    private String function;

    // 当前操作用户
    private String updateUser;
    private String updateProcess;

    // 前端批量角色数据（roles对象）
    @JsonProperty("roles")
    private Map<String, Object> roles;

    // UD18 文档权限管理
    @JsonProperty("documentTypes")
    private List<String> documentTypes;

    // UD19 搜索参数
    private String searchType;
    @JsonProperty("user")
    private String searchUser;

    // ============================================================
    // 手动添加的 getter/setter（Lombok 因字段名冲突跳过了这些）
    // ============================================================

    public String getUserid() {
        return userid;
    }

    public void setUserid(String userid) {
        this.userid = userid;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

}
