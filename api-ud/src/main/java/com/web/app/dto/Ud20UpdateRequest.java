package com.web.app.dto;

import lombok.Data;

/** UD20-1: 更新文档列表请求 */
@Data
public class Ud20UpdateRequest {
    private String doctype;
    private String registerUser;
    private String registerDatetime;
    private String registerProcess;
    private String updateUser;
    private String updateDatetime;
    private String updateProcess;
}
