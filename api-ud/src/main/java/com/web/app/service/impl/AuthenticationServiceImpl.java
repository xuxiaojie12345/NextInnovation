package com.web.app.service.impl;

import com.web.app.domain.entity.HdocUserInfor;
import com.web.app.dto.AuthenticationRequest;
import com.web.app.dto.LoginData;
import com.web.app.dto.LoginResponse;
import com.web.app.mapper.HdocUserInforMapper;
import com.web.app.service.AuthenticationService;

import org.apache.commons.lang.StringUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 認証サービス実装クラス（Login モジュール）
 * ログイン認証の業務ロジックを実装する
 */
@Service
public class AuthenticationServiceImpl implements AuthenticationService {

    private static final Logger logger = LogManager.getLogger(AuthenticationServiceImpl.class);

    @Autowired
    private HdocUserInforMapper hdocUserInforMapper;

    /**
     * ログイン認証処理
     *
     * @param request 認証リクエスト (userid, password)
     * @return LoginResponse 認証結果レスポンス
     */
    @Override
    public LoginResponse login(AuthenticationRequest request) {
        LoginResponse response = new LoginResponse();

        // 入力パラメータ検証（userid/passwordの必須チェック）
        if (request == null || StringUtils.isBlank(request.getUserid())
                || StringUtils.isBlank(request.getPassword())) {
            logger.warn("Invalid authentication request parameters: userid/password is required");

            response.setCode(400);
            response.setMessage("Username and password are required.");
            response.setData(null);
            return response;
        }

        logger.info("Calling HdocUserInforMapper.login with userid: " + request.getUserid());

        // HdocUserInforMapperのloginメソッドを呼び出し、DB照会を行う
        HdocUserInfor user = hdocUserInforMapper.login(request.getUserid(), request.getPassword());

        if (user != null) {
            // 認証成功：ユーザー情報をレスポンスに設定
            logger.info("Authentication successful for userid: " + request.getUserid());

            LoginData data = new LoginData();
            data.setUserId(user.getUserid());
            data.setUsername(user.getUsername());
            // token = userId + username
            data.setToken(user.getUserid() + user.getUsername());

            response.setCode(200);
            response.setMessage("登录成功");
            response.setData(data);
        } else {
            // 認証失敗：エラーメッセージを設定
            logger.warn("Authentication failed for userid: " + request.getUserid());

            response.setCode(401);
            response.setMessage("We didn't recognize the username or password you entered. Please try again.");
            response.setData(null);
        }

        return response;
    }
}
