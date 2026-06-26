package com.web.app.dto;

import lombok.Data;

/** UD10: 更新/新增/删除请求 */
@Data
public class Ud10VariableRequest {
    private String variable;
    private String type;
    private String description;
    private String registerDatetime;
    private String registerUser;
    private String registerProcess;
    private String updateDatetime;
    private String updateUser;
    private String updateProcess;
}
