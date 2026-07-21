package com.web.app.dto.request;

import lombok.Data;

@Data
public class UD10UpdateVariableRequest {
    private String variable;
    private String type;
    private String description;
}
