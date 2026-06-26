package com.web.app.dto;

import lombok.Data;
import java.math.BigDecimal;

/** UD06: 保存修改响应 */
@Data
public class SaveModificationsResponse {
    private String doctype;
    private BigDecimal vers;
    private String variable;
    private String newval;
}
