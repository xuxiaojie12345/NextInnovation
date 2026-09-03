package com.web.app.service;

import com.web.app.dto.AuthenticationRequest;
import com.web.app.dto.LoginResponse;

/**
 * 認証サービスインターフェース（Login モジュール）
 * ログイン認証のサービスメソッドを定義する
 */
public interface AuthenticationService {

    /**
     * ログイン認証処理
     *
     * @param request 認証リクエスト (userid, password)
     * @return LoginResponse 認証結果レスポンス
     */
    LoginResponse login(AuthenticationRequest request);
}
