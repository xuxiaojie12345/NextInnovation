package com.web.app.dto;

import lombok.Data;
import java.math.BigDecimal;

/** UD08: 删除请求 */
@Data
public class Ud08DeleteRequest {
    private String pc;
    private BigDecimal num;
    private String market;
}
