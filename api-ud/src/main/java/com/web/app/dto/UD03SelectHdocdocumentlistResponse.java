package com.web.app.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;
import java.util.List;

/**
 * UD03 获取文档类型列表响应对象
 * 
 * 功能说明：返回 HDOC_DOCUMENT_LIST 表中的 DOCTYPE 列表
 * 
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UD03SelectHdocdocumentlistResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 响应码
     * 200: 成功
     * 401: 未授权
     * 500: 服务器错误
     */
    private Integer code;

    /**
     * 响应消息
     */
    private String msg;

    /**
     * 响应数据 - 文档类型列表
     */
    private List<String> data;

    /**
     * 消息列表（用于详细错误信息）
     */
    private List<MessageItem> messageList;

    /**
     * 消息项内部类
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageItem {
        /**
         * 错误码
         */
        private String code;

        /**
         * 错误消息
         */
        private String message;
    }

    /**
     * 创建成功响应
     * 
     * @param doctypeList 文档类型列表
     * @return 成功响应对象
     */
    public static UD03SelectHdocdocumentlistResponse success(List<String> doctypeList) {
        UD03SelectHdocdocumentlistResponse response = new UD03SelectHdocdocumentlistResponse();
        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(doctypeList);
        return response;
    }

    /**
     * 创建失败响应
     * 
     * @param code 错误码
     * @param msg 错误消息
     * @return 失败响应对象
     */
    public static UD03SelectHdocdocumentlistResponse error(Integer code, String msg) {
        UD03SelectHdocdocumentlistResponse response = new UD03SelectHdocdocumentlistResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }
}
