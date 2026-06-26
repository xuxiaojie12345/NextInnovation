package com.web.app.dto;

import lombok.Data;

/** UD08/UD11: HdocVariables响应 */
@Data
public class HdocVariablesResponse {
    private String variable;
    private String type;
    private String description;
    private String registerUser;
    private String registerDatetime;
    private String registerProcess;
}
