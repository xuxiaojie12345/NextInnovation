package com.web.app.controller;

import com.web.app.dto.AuthenticationRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.service.AuthenticationService;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

/**
 * 認証コントローラー（Login モジュール）
 * ログイン認証リクエストを処理する
 */
@RestController
@RequestMapping("/api/Login")
@Api(tags = "Login API")
public class AuthenticationController {

    private static final Logger logger = LogManager.getLogger(AuthenticationController.class);

    @Autowired
    private AuthenticationService authenticationService;

    /**
     * ログイン認証API
     *
     * @param request リクエストパラメータ (userid, password)
     * @return LoginResponse 認証結果
     */
    @PostMapping("/Authentication")
    @ApiOperation("ユーザー認証")
    public LoginResponse authentication(@RequestBody AuthenticationRequest request) {
        logger.info("Authentication request received for userid: " + request.getUserid());

        LoginResponse response;
        try {
            // Service層のloginメソッドを呼び出し、認証処理を行う
            response = authenticationService.login(request);
        } catch (Exception e) {
            logger.error("Authentication error: " + e.getMessage(), e);
            response = new LoginResponse();
            response.setCode(500);
            response.setMessage("System error. Please contact support.");
            response.setData(null);
        }

        logger.info("Authentication response code: " + response.getCode());
        return response;
    }
}
