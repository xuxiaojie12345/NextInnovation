package com.web.app.service.impl;

import com.web.app.dto.AuthenticationRequest;
import com.web.app.dto.AuthenticationResponse;
import com.web.app.entity.HdocUserInfor;
import com.web.app.mapper.HdocUserInforMapper;
import com.web.app.service.AuthenticationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 认证服务实现类
 */
@Slf4j
@Service
public class AuthenticationServiceImpl implements AuthenticationService {

    @Autowired
    private HdocUserInforMapper hdocUserInforMapper;

    @Override
    public AuthenticationResponse authentication(AuthenticationRequest request) {
        log.info("开始用户认证，userId: {}", request.getUserId());

        AuthenticationResponse response = new AuthenticationResponse();

        try {
            // 查询用户信息（仅通过userId查询）
            HdocUserInfor user = hdocUserInforMapper.selectByUserId(
                    request.getUserId(), null);

            // 判断用户是否存在（统一错误消息，不暴露具体是用户名还是密码错误）
            if (user == null) {
                response.setCode(401);
                response.setMsg("We didn't recognize the username or password you entered. Please try again.");
                log.warn("用户认证失败，账号不存在: {}", request.getUserId());
                return response;
            }

            // 验证密码
            if (StringUtils.hasText(request.getPassword())) {
                if (!request.getPassword().equals(user.getPassword())) {
                    response.setCode(401);
                    response.setMsg("We didn't recognize the username or password you entered. Please try again.");
                    log.warn("用户认证失败，密码错误: {}", request.getUserId());
                    return response;
                }
            }

            // 认证成功，构建响应
            AuthenticationResponse.AuthenticationData data = new AuthenticationResponse.AuthenticationData();
            data.setUserId(user.getUserid());
            data.setUsername(user.getUsername());
            data.setResponsible(user.getResponsible());
            data.setUserPosition(user.getUserposition());
            data.setEmail(user.getEmail());
            // TODO: 生成Token
            data.setToken("TODO_GENERATE_TOKEN");

            response.setCode(200);
            response.setMsg("登录成功");
            response.setData(data);

            log.info("用户认证成功: {}", request.getUserId());

        } catch (Exception e) {
            log.error("用户认证异常", e);
            response.setCode(500);
            response.setMsg("服务器内部错误");
        }

        return response;
    }
}
