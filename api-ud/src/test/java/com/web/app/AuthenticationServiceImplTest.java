package com.web.app;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.web.app.domain.entity.HdocUserInfor;
import com.web.app.dto.AuthenticationRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.dto.LoginData;
import com.web.app.mapper.HdocUserInforMapper;
import com.web.app.service.impl.AuthenticationServiceImpl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 認証サービス実装クラス（AuthenticationServiceImpl）の単体テスト
 *
 * <p>テスト対象：{@link AuthenticationServiceImpl#login(AuthenticationRequest)}
 *
 * <p>網羅する分岐（100% 分岐カバレッジ）：
 * <ol>
 *   <li>request == null（null 分岐）</li>
 *   <li>userid が null / 空文字 / 空白のみ（isBlank 分岐）</li>
 *   <li>password が null / 空文字 / 空白のみ（isBlank 分岐）</li>
 *   <li>Mapper がユーザーを返す（認証成功 → code=200）</li>
 *   <li>Mapper が null を返す（認証失敗 → code=401）</li>
 * </ol>
 *
 * <p>Mapper は Mockito でモック化するため DB 接続は不要。
 */
@ExtendWith(MockitoExtension.class)
class AuthenticationServiceImplTest {

    /** DB 照会を行う Mapper（モック） */
    @Mock
    private HdocUserInforMapper hdocUserInforMapper;

    /** テスト対象（@InjectMocks により上記モックが注入される） */
    @InjectMocks
    private AuthenticationServiceImpl authenticationService;

    /** リクエスト DTO を生成するヘルパー */
    private static AuthenticationRequest request(String userid, String password) {
        AuthenticationRequest request = new AuthenticationRequest();
        request.setUserid(userid);
        request.setPassword(password);
        return request;
    }

    /** ユーザー Entity を生成するヘルパー */
    private static HdocUserInfor user(String userid, String password, String username) {
        HdocUserInfor user = new HdocUserInfor();
        user.setUserid(userid);
        user.setPassword(password);
        user.setUsername(username);
        return user;
    }

    /** 必須チェックエラー（code=400）の共通検証 */
    private static void assertBadRequest(LoginResponse response) {
        assertThat(response.getCode()).isEqualTo(400);
        assertThat(response.getMessage()).isEqualTo("Username and password are required.");
        assertThat(response.getData()).isNull();
    }

    // ============================================================
    // 1. 入力パラメータの必須チェック（null / 空文字 / 空白）
    // ============================================================

    @Test
    @DisplayName("login: request が null の場合、code=400 を返し Mapper を呼び出さない")
    void login_requestIsNull() {
        // 実行
        LoginResponse response = authenticationService.login(null);

        // 検証（null 分岐）
        assertBadRequest(response);
        verifyNoInteractions(hdocUserInforMapper);
    }

    @Test
    @DisplayName("login: userid が null の場合、code=400 を返し Mapper を呼び出さない")
    void login_useridIsNull() {
        LoginResponse response = authenticationService.login(request(null, "pw123456"));

        assertBadRequest(response);
        verifyNoInteractions(hdocUserInforMapper);
    }

    @Test
    @DisplayName("login: userid が空文字の場合、code=400 を返し Mapper を呼び出さない")
    void login_useridIsEmpty() {
        LoginResponse response = authenticationService.login(request("", "pw123456"));

        assertBadRequest(response);
        verifyNoInteractions(hdocUserInforMapper);
    }

    @Test
    @DisplayName("login: userid が空白のみの場合、code=400 を返し Mapper を呼び出さない")
    void login_useridIsBlank() {
        LoginResponse response = authenticationService.login(request("   ", "pw123456"));

        assertBadRequest(response);
        verifyNoInteractions(hdocUserInforMapper);
    }

    @Test
    @DisplayName("login: password が null の場合、code=400 を返し Mapper を呼び出さない")
    void login_passwordIsNull() {
        LoginResponse response = authenticationService.login(request("userid01", null));

        assertBadRequest(response);
        verifyNoInteractions(hdocUserInforMapper);
    }

    @Test
    @DisplayName("login: password が空文字の場合、code=400 を返し Mapper を呼び出さない")
    void login_passwordIsEmpty() {
        LoginResponse response = authenticationService.login(request("userid01", ""));

        assertBadRequest(response);
        verifyNoInteractions(hdocUserInforMapper);
    }

    @Test
    @DisplayName("login: password が空白のみの場合、code=400 を返し Mapper を呼び出さない")
    void login_passwordIsBlank() {
        LoginResponse response = authenticationService.login(request("userid01", "   "));

        assertBadRequest(response);
        verifyNoInteractions(hdocUserInforMapper);
    }

    // ============================================================
    // 2. 認証成功（Mapper がユーザーを返す）
    // ============================================================

    @Test
    @DisplayName("login: 認証成功時、code=200 とユーザー情報（token=userId+username）を返す")
    void login_success() {
        // 準備：Mapper がユーザーを返す
        when(hdocUserInforMapper.login("userid01", "pw123456"))
                .thenReturn(user("userid01", "pw123456", "username01"));

        // 実行
        LoginResponse response = authenticationService.login(request("userid01", "pw123456"));

        // 検証（成功分岐）
        assertThat(response.getCode()).isEqualTo(200);
        assertThat(response.getMessage()).isEqualTo("登录成功");
        LoginData data = response.getData();
        assertThat(data).isNotNull();
        assertThat(data.getUserId()).isEqualTo("userid01");
        assertThat(data.getUsername()).isEqualTo("username01");
        // token = userId + username
        assertThat(data.getToken()).isEqualTo("userid01username01");

        // Mapper が入力値で呼び出されたこと
        verify(hdocUserInforMapper).login("userid01", "pw123456");
    }

    @Test
    @DisplayName("login: 認証成功かつ username が null の場合、token は userId と null 文字列の連結になる")
    void login_successWithNullUsername() {
        // 準備：username が null のユーザー
        when(hdocUserInforMapper.login("userid01", "pw123456"))
                .thenReturn(user("userid01", "pw123456", null));

        // 実行
        LoginResponse response = authenticationService.login(request("userid01", "pw123456"));

        // 検証
        assertThat(response.getCode()).isEqualTo(200);
        assertThat(response.getData()).isNotNull();
        assertThat(response.getData().getUsername()).isNull();
        assertThat(response.getData().getToken()).isEqualTo("userid01null");
    }

    // ============================================================
    // 3. 認証失敗（Mapper が null を返す）
    // ============================================================

    @Test
    @DisplayName("login: ユーザーが存在しない場合、code=401 とエラーメッセージを返す")
    void login_failure_userNotFound() {
        // 準備：Mapper が null を返す
        when(hdocUserInforMapper.login("nouser01", "wrong123")).thenReturn(null);

        // 実行
        LoginResponse response = authenticationService.login(request("nouser01", "wrong123"));

        // 検証（失敗分岐）
        assertThat(response.getCode()).isEqualTo(401);
        assertThat(response.getMessage())
                .isEqualTo("We didn't recognize the username or password you entered. Please try again.");
        assertThat(response.getData()).isNull();

        // Mapper が入力値で呼び出されたこと
        verify(hdocUserInforMapper).login("nouser01", "wrong123");
    }
}
