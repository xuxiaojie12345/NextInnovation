package com.web.app.dto;

import lombok.Data;
import java.math.BigDecimal;

/** UD08: 更新请求 */
@Data
public class Ud08UpdateRequest {
    private String pc;
    private BigDecimal num;
    private String market;
    private String variable;
    private String val;
    private String vs;
    private String vs2;
    private String comments;
    private String updateUser;
    private String updateDatetime;
    private String updateProcess;
}
