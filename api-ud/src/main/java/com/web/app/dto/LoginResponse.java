package com.web.app.dto;

import lombok.Data;

/**
 * ログインレスポンス DTO
 * 認証結果をフロントエンドに返すための統一レスポンス形式
 */
@Data
public class LoginResponse {

    /**
     * レスポンスコード (200: 成功, 401: 失敗)
     */
    private int code;

    /**
     * レスポンスメッセージ
     */
    private String message;

    /**
     * レスポンスデータ（認証成功時のユーザー情報）
     */
    private LoginData data;
}
