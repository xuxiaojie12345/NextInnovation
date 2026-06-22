package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD12 - 上传/删除模板响应DTO
 */
@Data
public class UD12UploadDeletetemplatResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;
    private String msg;
    private Object data;
}
