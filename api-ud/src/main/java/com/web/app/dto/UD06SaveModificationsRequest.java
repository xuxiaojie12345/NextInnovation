package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD06 - Save Modifications查询请求DTO
 */
@Data
public class UD06SaveModificationsRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** Chassis Serie */
    private String chassisSerie;

    /** Chassis Number */
    private String chassisNumber;
}
