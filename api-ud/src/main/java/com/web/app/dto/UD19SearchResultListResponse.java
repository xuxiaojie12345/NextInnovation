package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD19 - Search Result List响应DTO
 */
@Data
public class UD19SearchResultListResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;
    private String msg;
    private Object data;
}
