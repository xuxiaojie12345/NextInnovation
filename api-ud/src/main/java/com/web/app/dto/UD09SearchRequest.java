package com.web.app.dto;

import lombok.Data;

@Data
public class UD09SearchRequest {
    private String productClass;
    private String number;
    private String market;
    private String variable;
    private String value;
    private String string1;
    private String string2;
    private String comments;
}
