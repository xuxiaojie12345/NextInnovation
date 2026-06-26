package com.web.app.dto;

import lombok.Data;

/** UD09: 检索请求 */
@Data
public class Ud09SearchRequest {
    private String pc;
    private String num;
    private String market;
    private String variable;
    private String val;
    private String vs;
    private String vs2;
    private String comments;
}
