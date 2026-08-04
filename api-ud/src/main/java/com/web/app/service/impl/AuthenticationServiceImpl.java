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
        if (request.getUserId() == null || request.getPassword() == null) {
            throw new BusinessException(400, "UserId and password are required");
        }
        HdocUserInfo user = userInfoMapper.selectByUserIdAndPassword(request.getUserId(), request.getPassword());
        if (user == null) {
            throw new BusinessException(401, "Invalid username or password.");
        }
        AuthenticationResponse response = AuthenticationResponse.builder()
            .userId(user.getUserid())
            .name(user.getUsername())
            .role(user.getResponsible())
            .userName(user.getUsername())
            .responsible(user.getResponsible())
            .userPosition(user.getUserposition())
            .email(user.getEmail())
            .build();
        return response;
    }
}
