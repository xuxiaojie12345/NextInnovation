package com.web.app.domain;

import lombok.Data;

/**
 * UD09 Delete User Defined Rules Request (Single Item)
 * 删除用户定义规则请求参数（单条记录的主键）
 */
@Data
public class UD09DeleteUserDefinedRulesRequest {

    /** 产品类别 */
    private String productClass;

    /** 编号 */
    private Integer number;

    /** 市场 */
    private String market;
}
