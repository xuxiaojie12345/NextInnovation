package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD19 - Search Result List请求DTO
 */
@Data
public class UD19SearchResultListRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 用户ID */
    private String userid;

    /** 用户名 */
    private String user;

    /** 市场 */
    private String market;

    /** 市场列表（多选） */
    private java.util.List<String> markets;

    /** 未配置 */
    private String notSet;

    /** 规则 */
    private String rule;

    /** 模板 */
    private String template;
}
