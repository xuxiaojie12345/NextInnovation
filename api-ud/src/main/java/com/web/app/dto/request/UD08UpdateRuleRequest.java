package com.web.app.dto.request;

import lombok.Data;

@Data
public class UD08UpdateRuleRequest {
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
}
