package com.web.app.controller;

import com.web.app.domain.AuthenticationRequest;
import com.web.app.domain.AuthenticationResponse;
import com.web.app.service.UD01Service;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;

/**
 * UD01控制器
 * 提供UD01AuthenticationApi接口 - 用户认证
 */
@Api(tags = "认证管理")
@RestController
@RequestMapping("/api")
/**

 * UD01Controller

 */

public class UD01Controller extends BaseController {
    
    @Autowired
    /** ud01Service */

    private UD01Service ud01Service;
    
    /**
     * 用户认证接口
     * 
     * @param request 认证请求
     * @param session HTTP会话
     * @return 认证响应
     */
    @ApiOperation(value = "用户认证", notes = "验证用户名和密码,成功后将用户信息存储到Session")
    @PostMapping("/authentication")
    /**

     * authenticate

     */

    public AuthenticationResponse authenticate(@RequestBody AuthenticationRequest request, HttpSession session) {
        // 调用服务层进行认证
        AuthenticationResponse response = ud01Service.authenticate(request);
        
        // 如果认证成功,将完整用户信息存储到Session
        if (response.getCode() == 200 && response.getData() != null && response.getData().getSuccess()) {
            session.setAttribute("currentUser", response.getData().getUserInfo());
        }
        
        return response;
    }
}
