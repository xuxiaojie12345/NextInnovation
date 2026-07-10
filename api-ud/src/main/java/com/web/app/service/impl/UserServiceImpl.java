package com.web.app.service.impl;

import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.entity.UserInfo;
import com.web.app.mapper.UserInfoMapper;
import com.web.app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

  @Autowired
  private UserInfoMapper userInfoMapper;

  @Override
  public UserInfo findByUseridAndPassword(String userid, String password) {
    return userInfoMapper.findByUseridAndPassword(userid, password);
  }

  @Override
  public LoginResponse.LoginData authenticate(LoginRequest request) {
    UserInfo user = findByUseridAndPassword(request.getUserid(), request.getPassword());
    if (user != null) {
      LoginResponse.LoginData loginData = new LoginResponse.LoginData();
      loginData.setToken("mock-token-" + System.currentTimeMillis());
      loginData.setUserid(user.getUserid());
      loginData.setUsername(user.getUsername());
      return loginData;
    }
    return null;
  }
}
