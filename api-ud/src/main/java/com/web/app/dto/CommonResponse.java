package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

/**
 * 通用响应DTO
 */
@Data
public class CommonResponse implements Serializable {
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
    
    /**
     * 成功响应
     */
    public static CommonResponse success(Object data) {
        CommonResponse response = new CommonResponse();
        response.setCode(200);
        response.setMsg("成功");
        response.setData(data);
        return response;
    }
    
    /**
     * 成功响应（带自定义消息）
     */
    public static CommonResponse success(String msg, Object data) {
        CommonResponse response = new CommonResponse();
        response.setCode(200);
        response.setMsg(msg);
        response.setData(data);
        return response;
    }
    
    /**
     * 失败响应
     */
    public static CommonResponse error(String msg) {
        CommonResponse response = new CommonResponse();
        response.setCode(500);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }
}
