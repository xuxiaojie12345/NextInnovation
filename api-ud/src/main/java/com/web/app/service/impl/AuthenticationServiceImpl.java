package com.web.app.service.impl;

import com.web.app.dto.request.AuthenticationRequest;
import com.web.app.dto.response.AuthenticationResponse;
import com.web.app.entity.HdocUserInfo;
import com.web.app.exception.BusinessException;
import com.web.app.mapper.HdocUserInfoMapper;
import com.web.app.service.AuthenticationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationServiceImpl implements AuthenticationService {

    @Autowired
    private HdocUserInfoMapper userInfoMapper;

    @Override
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        String userId = request.getUserId();
        boolean needPassword = request.getNeedPassword() == null || request.getNeedPassword();

        if (userId == null || userId.trim().isEmpty()) {
            throw new BusinessException(400, "UserID parameter is missing.");
        }

        if (needPassword) {
            // Login 场景：要求 userId + password
            if (request.getPassword() == null) {
                throw new BusinessException(400, "UserId and password are required");
            }
            HdocUserInfo user = userInfoMapper.selectByUserIdAndPassword(userId.trim(), request.getPassword());
            if (user == null) {
                throw new BusinessException(401, "Invalid username or password.");
            }
            return toResponse(user);
        }

        // UserView / EDB User View 场景：仅按 userId 查询用户信息（不校验 password）
        HdocUserInfo user = userInfoMapper.selectByUserId(userId.trim());
        if (user == null) {
            throw new BusinessException(404, "User not found. Please try again.");
        }
        return toResponse(user);
    }

    private AuthenticationResponse toResponse(HdocUserInfo user) {
        return AuthenticationResponse.builder()
            .userId(user.getUserid())
            .name(user.getUsername())
            .role(user.getResponsible())
            .userName(user.getUsername())
            .responsible(user.getResponsible())
            .userPosition(user.getUserposition())
            .email(user.getEmail())
            .build();
    }
}
