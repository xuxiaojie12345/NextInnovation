package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD20 - 文档列表查询响应DTO
 */
@Data
public class UD20GetDocumentListResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;
    private String msg;
    private Object data;
}
