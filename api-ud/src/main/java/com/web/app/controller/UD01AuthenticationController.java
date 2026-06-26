package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.service.UD01AuthenticationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

/**
 * UD01认证控制器
 * 对应API：UD01AuthenticationApi
 * 
 * 处理流程（严格按照txt文件4.1节）：
 * 4.1 客户端通过POST请求访问接口 /api/ud01/login，将UserId、UserName、Password等请求参数，以JSON格式发送至后端服务。
 * 
 * 4.2 后端XXXXXController接收前端请求，通过XXXXXRequest实体对象封装并校验请求参数，完成请求入口层的参数接收与初步格式验证。
 * 
 * 4.3 控制器层调用XXXXXService接口中的 login() 方法，将校验后的请求对象传递至业务逻辑层处理。
 */
@RestController
@RequestMapping("/api")
public class UD01AuthenticationController {
    
    @Autowired
    private UD01AuthenticationService authenticationService;
    
    /**
     * 用户登录接口
     * 
     * @param loginRequest 登录请求参数（包含userid、username、password）
     * @return 统一响应包装类，包含登录结果和用户信息
     */
    @PostMapping("/ud01/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
        @Validated @RequestBody LoginRequest loginRequest
    ) {
        // 4.3 调用Service层处理登录逻辑
        LoginResponse loginResponse = authenticationService.login(loginRequest);
        
        // 4.8 封装LoginResponse响应对象，统一返回标准格式
        ApiResponse<LoginResponse> response = ApiResponse.success("登录成功", loginResponse);
        
        return ResponseEntity.ok(response);
    }

    /**
     * 处理业务异常（如账号不存在、密码错误等）
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Void>> handleRuntimeException(RuntimeException e) {
        ApiResponse<Void> response = ApiResponse.error(401, e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }
    
    /**
     * 处理参数校验异常（如字段为空、长度超限等）
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException e) {
        String errorMsg = e.getBindingResult().getFieldErrors().stream()
            .map(fieldError -> fieldError.getDefaultMessage())
            .findFirst()
            .orElse("请求参数校验失败");
        ApiResponse<Void> response = ApiResponse.error(400, errorMsg);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    /**
     * 处理通用异常（兜底）
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception e) {
        ApiResponse<Void> response = ApiResponse.error(500, "服务器内部错误");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
