package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD20 - Market Document Settings响应DTO
 */
@Data
public class UD20MarketDocumentSettingsResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;
    private String msg;
    private Object data;
}
