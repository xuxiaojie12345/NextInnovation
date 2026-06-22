package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * UD05 - Modify Document响应DTO
 */
@Data
public class UD05ModifyDocumentResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;
    private String msg;
    private Object data;
}
