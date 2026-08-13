package com.web.app.dto.request;

import lombok.Data;

@Data
public class UD08AddRuleRequest {
    private String pc;
    private String num;
    private String market;
    private String vs;
    private String vs2;
    private String variable;
    private String val;
    private String comments;
    private String addDate;
    private String deleteDate;
    private String userId;
}
