package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD14 - 搜索结果列表响应DTO
 */
@Data
public class UD14SearchresultistResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;
    private String msg;
    private Object data;
}
