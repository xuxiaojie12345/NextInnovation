package com.web.app.dto;

import lombok.Data;
import java.math.BigDecimal;

/** UD08: 新增请求 */
@Data
public class Ud08AddRequest {
    private String pc;
    private BigDecimal num;
    private String market;
    private String variable;
    private String val;
    private String vs;
    private String vs2;
    private String comments;
    private String addDate;
    private String deleteDate;
    private String registerDatetime;
    private String registerUser;
    private String registerProcess;
    private String updateDatetime;
    private String updateUser;
    private String updateProcess;
}
