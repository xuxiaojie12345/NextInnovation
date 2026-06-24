package com.web.app.dto;

import lombok.Data;
import java.math.BigDecimal;

/** UD04: 生成文档响应 */
@Data
public class SelectGenerateDocumentResponse {
    private String ordernumber;
    private BigDecimal build;
    private BigDecimal spec;
    private String customerAdap;
    private String countryOfOperation;
    private String loadIndex;
    private String act;
    private String variable;
}
