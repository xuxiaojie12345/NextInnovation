package com.web.app.service;

import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.entity.UserInfo;

public interface UserService {
  UserInfo findByUseridAndPassword(String userid, String password);

  LoginResponse.LoginData authenticate(LoginRequest request);
}
