package com.web.app.dto;

import lombok.Data;

@Data
public class UD10HdocvariablesRequest {
    private String variable;
    private String type;
    private String description;
    private String user;
    private String date;
}
