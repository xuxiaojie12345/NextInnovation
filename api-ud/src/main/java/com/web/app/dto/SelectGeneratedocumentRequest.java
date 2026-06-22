package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD04 - Generate document查询请求DTO
 */
@Data
public class SelectGeneratedocumentRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 底盘编号 */
    private String chassisSeries;

    /** 订单号 */
    private String chassisNo;

    /** 市场 */
    private String documentType;
}
