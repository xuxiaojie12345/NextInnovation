package com.web.app.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;

/**
 * 认证响应DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthenticationResponse implements Serializable {
    
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
    private AuthenticationData data;
    
    /**
     * 内部数据类
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthenticationData implements Serializable {
        private static final long serialVersionUID = 1L;
        
        /**
         * 用户ID
         */
        private String userId;
        
        /**
         * 用户名
         */
        private String username;
        
        /**
         * 负责人
         */
        private String responsible;
        
        /**
         * 用户职位
         */
        private String userPosition;
        
        /**
         * 邮箱
         */
        private String email;
        
        /**
         * Token
         */
        private String token;
    }
}
