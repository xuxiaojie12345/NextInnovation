package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * 登录响应DTO
 */
@Data
public class LoginResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    
    /**
     * 响应码
     */
    private Integer code;
    
    /**
     * 响应消息
     */
    private String msg;
    
    /**
     * 响应数据
     */
    private Object data;
}
