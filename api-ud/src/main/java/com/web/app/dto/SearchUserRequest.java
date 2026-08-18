package com.web.app.dto;

import lombok.Data;

/**
 * SearchUserApi 请求对象
 * 对应设计书 4.1 Request（GET /api/SearchUser）
 */
@Data
public class SearchUserRequest {

    /** 用户ID（可选，最大10字符，半角英数字） */
    private String serid;

    /** 用户名（可选，最大32字符，半角英数字） */
    private String user;

    /** Market 检索条件（可选，动态加载；为空时取消条件） */
    private String market;

    /** 权限类型条件（NOT_SET / RULE / TEMPLATE；NOT_SET 时取消条件） */
    private String function;
}
