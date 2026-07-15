package com.web.app.controller;

import com.web.app.constant.MessageConstants;
import com.web.app.dto.ApiResponse;
import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class LoginController extends BaseController {

  @Autowired
  private UserService userService;

  @PostMapping("/login")
  public ResponseEntity<ApiResponse<LoginResponse.LoginData>> login(
      @RequestBody LoginRequest request) {
    try {
      if (isParamMissing(request.getUserid())) {
        return unauthorized(MessageConstants.LOGIN_CREDENTIALS_REQUIRED);
      }

      LoginResponse.LoginData loginData = userService.authenticate(request);

      if (loginData != null) {
        return ok(loginData, MessageConstants.LOGIN_SUCCESS);
      } else {
        return unauthorized(MessageConstants.LOGIN_INVALID_CREDENTIALS);
      }
    } catch (Exception e) {
      return systemError();
    }
  }
}
