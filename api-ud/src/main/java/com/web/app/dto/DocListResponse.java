package com.web.app.dto;

import lombok.Data;

/** UD18: 文档列表响应 */
@Data
public class DocListResponse {
    private String description;
    private String doctype;
    private String registerUser;
    private String registerDatetime;
}
