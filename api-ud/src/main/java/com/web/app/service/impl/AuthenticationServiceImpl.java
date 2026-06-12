package com.web.app.service.impl;

import com.web.app.service.AuthenticationService;
import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.mapper.HdocUserInforMapper;
import com.web.app.entity.HdocUserInfor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class AuthenticationServiceImpl implements AuthenticationService {

    @Autowired
    private HdocUserInforMapper hdocUserInforMapper;

    @Override
    public LoginResponse login(LoginRequest request) {
        // 1. Validate input
        if (request == null || request.getUserId() == null || request.getUserId().trim().isEmpty()
                || request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return LoginResponse.error("Username and password are required.");
        }

        String userId = request.getUserId().trim();
        String password = request.getPassword().trim();

        // 2. Query user from DB
        HdocUserInfor user = hdocUserInforMapper.findByUserIdAndPassword(userId, password);
        if (user == null) {
            // Check if user exists at all
            int count = hdocUserInforMapper.countByUserId(userId);
            if (count == 0) {
                return LoginResponse.error("We didn't recognize the username or password you entered. Please try again.");
            }
            return LoginResponse.error("We didn't recognize the username or password you entered. Please try again.");
        }

        // 3. Generate token
        String token = UUID.randomUUID().toString();

        // 4. Return success
        return LoginResponse.success(token, user.getUserid(), user.getUsername());
    }
}
