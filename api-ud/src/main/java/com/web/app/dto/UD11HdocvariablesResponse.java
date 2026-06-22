package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * UD11 - HDoc变量搜索响应DTO
 */
@Data
public class UD11HdocvariablesResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;
    private String msg;
    private UD11HdocvariablesData data;

    @Data
    public static class UD11HdocvariablesData implements Serializable {
        private static final long serialVersionUID = 1L;

        private List<Map<String, Object>> variables;
        private Integer count;
    }
}
