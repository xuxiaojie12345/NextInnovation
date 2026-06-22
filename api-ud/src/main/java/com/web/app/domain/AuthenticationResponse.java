package com.web.app.domain;

import com.web.app.domain.entity.UserInfo;
import java.io.Serializable;

/**
 * 认证响应DTO
 */
public class AuthenticationResponse implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 响应码
     */
    private Integer code;
    
    /**
     * 响应消息
     */
    private String message;
    
    /**
     * 响应数据
     */
    private ResponseData data;
    
    /**
     * 响应数据内部类
     */
    public static class ResponseData implements Serializable {
        
        private static final long serialVersionUID = 1L;
        
        /**
         * 认证成功标志
         */
        private Boolean success;
        
        /**
         * 用户完整信息
         */
        private UserInfo userInfo;
        
        public Boolean getSuccess() {
            return success;
        }
        
        public void setSuccess(Boolean success) {
            this.success = success;
        }
        
        public UserInfo getUserInfo() {
            return userInfo;
        }
        
        public void setUserInfo(UserInfo userInfo) {
            this.userInfo = userInfo;
        }
    }
    
    // Getter and Setter methods
    
    public Integer getCode() {
        return code;
    }
    
    public void setCode(Integer code) {
        this.code = code;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public ResponseData getData() {
        return data;
    }
    
    public void setData(ResponseData data) {
        this.data = data;
    }
}
