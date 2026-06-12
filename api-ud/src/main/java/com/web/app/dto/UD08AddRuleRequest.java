package com.web.app.dto;

import lombok.Data;

@Data
public class UD08AddRuleRequest {
    private String productClass;
    private String number;
    private String market;
    private String variable;
    private String value;
    private String variantString1;
    private String variantString2;
    private String comments;
    private String add;
    private String delete;
    private String createdByUser;
    private String date;
}
