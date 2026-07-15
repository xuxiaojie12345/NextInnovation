package com.web.app.service.impl;

import com.web.app.domain.AuthenticationRequest;
import com.web.app.domain.AuthenticationResponse;
import com.web.app.domain.entity.UserInfo;
import com.web.app.mapper.UserInfoMapper;
import com.web.app.service.UD01Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * UD01服务实现类
 */
@Service
/**

 * UD01ServiceImpl

 */

public class UD01ServiceImpl implements UD01Service {
    
    @Autowired
    /** userInfoMapper */

    private UserInfoMapper userInfoMapper;
    
    /**
     * 用户认证
     * 
     * @param request 认证请求(包含username和password)
     * @return 认证响应(包含成功标志和完整用户信息)
     */
    @Override
    /**

     * authenticate

     */

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        AuthenticationResponse response = new AuthenticationResponse();
        AuthenticationResponse.ResponseData responseData = new AuthenticationResponse.ResponseData();
        
        // 参数校验
        if (request == null || request.getUsername() == null || request.getPassword() == null) {
            response.setCode(400);
            response.setMessage("Username and password are required.");
            responseData.setSuccess(false);
            response.setData(responseData);
            return response;
        }
        
        // USERID转大写,支持大小写不敏感登录
        String userid = request.getUsername().trim().toUpperCase();
        String password = request.getPassword().trim();
        
        // 查询数据库
        UserInfo userInfo = userInfoMapper.findByUserIdAndPassword(userid, password);
        
        if (userInfo != null) {
            // 认证成功
            response.setCode(200);
            response.setMessage("Authentication successful.");
            responseData.setSuccess(true);
            responseData.setUserInfo(userInfo);
            response.setData(responseData);
        } else {
            // 认证失败
            response.setCode(401);
            response.setMessage("We didn't recognize the username or password you entered. Please try again.");
            responseData.setSuccess(false);
            response.setData(responseData);
        }
        
        return response;
    }
}
