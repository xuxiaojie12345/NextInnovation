package com.web.app.service;
import com.web.app.domain.Entity.UserInfo;

public interface UserInfoService {
    UserInfo login(String userId, String password);
    UserInfo getUserById(String userId);
}