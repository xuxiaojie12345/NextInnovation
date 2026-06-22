package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD20 - 文档列表查询请求DTO
 */
@Data
public class UD20GetDocumentListRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 文档类型 */
    private String documentType;

    /** 业务单元 */
    private String businessUnit;

    /** 用户 */
    private String user;

    /** 日期 */
    private String date;
}
