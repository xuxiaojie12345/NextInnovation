package com.web.app.dto;

import lombok.Data;

/**
 * ログインデータ DTO
 * 認証成功時のユーザー情報を保持する
 */
@Data
public class LoginData {

    /**
     * トークン (userId + username)
     */
    private String token;

    /**
     * ユーザーID
     */
    private String userId;

    /**
     * ユーザー名
     */
    private String username;
}
