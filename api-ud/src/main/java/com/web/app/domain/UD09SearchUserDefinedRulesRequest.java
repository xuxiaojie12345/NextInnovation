package com.web.app.domain;

import lombok.Data;

/**
 * UD09 Search User Defined Rules Request
 * 搜索用户定义规则请求参数
 */
@Data
public class UD09SearchUserDefinedRulesRequest {

    /** 产品类别 */
    private String productClass;

    /** 编号 */
    private Integer number;

    /** 市场 */
    private String market;

    /** 变量（模糊查询） */
    private String variable;

    /** 值（模糊查询） */
    private String value;

    /** 变体字符串1（模糊查询） */
    private String variantString1;

    /** 变体字符串2（模糊查询） */
    private String variantString2;

    /** 备注（模糊查询） */
    private String comments;

    /** Add日期（模糊查询） */
    private String addDate;

    /** Delete日期（模糊查询） */
    private String deleteDate;

    /** 创建用户（模糊查询） */
    private String createdByUser;

    /** 日期（模糊查询） */
    private String date;

    // ========== 操作符字段 ==========

    /** 产品类别操作符（=, !=） */
    private String productClassOperator;

    /** 编号操作符（=, >, <） */
    private String numberOperator;

    /** 市场操作符（=, !=） */
    private String marketOperator;

    /** 变量操作符（=, !=） */
    private String variableOperator;

    /** 值操作符（=, !=） */
    private String valueOperator;

    /** 变体字符串1操作符（=, !=） */
    private String variantString1Operator;

    /** 变体字符串2操作符（=, !=） */
    private String variantString2Operator;

    /** 备注操作符（=, !=） */
    private String commentsOperator;

    /** Add日期操作符（=, !=） */
    private String addDateOperator;

    /** Delete日期操作符（=, !=） */
    private String deleteDateOperator;

    /** 创建用户操作符（=, !=） */
    private String createdByUserOperator;

    /** 日期操作符（=, >, <） */
    private String dateOperator;
}
