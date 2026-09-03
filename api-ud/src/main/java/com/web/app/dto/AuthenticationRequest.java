package com.web.app.dto;

import lombok.Data;

/**
 * 認証リクエスト DTO
 * ログイン画面から送信されるリクエストパラメータを封装する
 */
@Data
public class AuthenticationRequest {

    /**
     * ユーザーID
     */
    private String userid;

    /**
     * パスワード
     */
    private String password;
}
