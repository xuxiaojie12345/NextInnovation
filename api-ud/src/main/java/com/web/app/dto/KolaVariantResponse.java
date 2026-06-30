package com.web.app.dto;

import lombok.Data;
import java.math.BigDecimal;

/** UD07: KOLA Variant响应 */
@Data
public class KolaVariantResponse {
    private String symbol;
    private String functionGroup;
    private String description;
}
