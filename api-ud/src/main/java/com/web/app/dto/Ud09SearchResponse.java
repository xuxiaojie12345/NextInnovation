package com.web.app.dto;

import lombok.Data;

/** UD09: 检索响应 */
@Data
public class Ud09SearchResponse {
    private String pc;
    private String num;
    private String market;
    private String variable;
    private String val;
    private String vs;
    private String vs2;
    private String comments;
    private String addDate;
    private String deleteDate;
    private String updateUser;
    private String updateDate;
    private String updateDatetime;
    private String registerDate;
    private String registerDatetime;
    private String registerUser;
}
