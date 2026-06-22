package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD16 - AD Change操作请求DTO
 */
@Data
public class UD16ADChangeRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** Serie/Chassis Number */
    private String serieChnr;

    /** 描述 */
    private String desc;

    /** 业务单元 */
    private String bu;

    /** 用户 */
    private String user;
}
