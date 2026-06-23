package com.web.app.service.impl;
import com.web.app.domain.Entity.UserInfo;
import com.web.app.mapper.UserInfoMapper;
import com.web.app.service.UserInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserInfoServiceImpl implements UserInfoService {

    @Autowired
    private UserInfoMapper userInfoMapper;

    @Override
    public UserInfo login(String userId, String password) {
        UserInfo user = userInfoMapper.selectUserById(userId);
        if (user != null && user.getPassword().equals(password)) {
            return user;
        }
        return null;
    }

    @Override
    public UserInfo getUserById(String userId) {
        return userInfoMapper.selectUserById(userId);
    }
}