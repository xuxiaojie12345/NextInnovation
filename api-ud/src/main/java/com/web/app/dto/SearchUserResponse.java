package com.web.app.dto;

import java.util.List;

import lombok.Data;

/**
 * SearchUserApi 响应数据体
 * 对应设计书 4.1 Response Success 的 data 部分：
 * {
 *   "token": "xxxx",
 *   "count": 5,
 *   "users": [ { "userid": "...", "user": "...", "market": "..." } ]
 * }
 */
@Data
public class SearchUserResponse {

    /** Token（包含检索数据件数、访问DB是否成功等信息） */
    private String token;

    /** 检索结果记录数 */
    private int count;

    /** 检索结果用户列表 */
    private List<UserSearchResult> users;

    /**
     * 检索结果用户信息
     */
    @Data
    public static class UserSearchResult {

        /** 用户ID */
        private String userid;

        /** 用户名 */
        private String user;

        /** 用户所属 Market */
        private String market;
    }
}
