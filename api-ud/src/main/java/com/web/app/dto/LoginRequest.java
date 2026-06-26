package com.web.app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 登录请求DTO
 * 对应API：UD01Authentication - /api/UD01/login
 * 
 * 说明：此API为共通API，除Login画面外其他画面也会调用。
 *       不同画面传递的参数不同：
 *       - Login画面：传递userId + password
 *       - 其他画面：可能传递userId + username + password
 *       因此username设为可选字段。
 */
@Data
public class LoginRequest {
    
    /**
     * 用户ID（必填）
     * 许容文字：半角英数字 [a-zA-Z0-9]
     * MaxLength: 10
     */
    @NotBlank(message = "用户ID不能为空")
    @Size(max = 10, message = "用户ID长度不能超过10")
    private String userId;
    
    /**
     * 用户名（可选，其他画面调用时可能传递）
     */
    @Size(max = 100, message = "用户名长度不能超过100")
    private String username;
    
    /**
     * 密码（Login画面必填，EdbUserView画面可选）
     * 许容文字：半角英数字 + 記号
     * MaxLength: 32
     */
    @Size(max = 32, message = "密码长度不能超过32")
    @JsonProperty("passWord")
    private String password;
}
