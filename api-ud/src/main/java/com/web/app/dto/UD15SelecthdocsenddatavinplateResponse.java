package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD15 - VIN Plate操作响应DTO
 */
@Data
public class UD15SelecthdocsenddatavinplateResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;
    private String msg;
    private Object data;
}
