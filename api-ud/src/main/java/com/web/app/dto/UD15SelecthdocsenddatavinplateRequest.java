package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD15 - VIN Plate操作请求DTO
 */
@Data
public class UD15SelecthdocsenddatavinplateRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** Serie */
    private String serie;

    /** Chassis Number */
    private String chassisNumber;
}
