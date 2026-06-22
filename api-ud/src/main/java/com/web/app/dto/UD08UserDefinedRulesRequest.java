package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD08 - 用户定义规则请求DTO（Add/Update/Delete共用）
 */
@Data
public class UD08UserDefinedRulesRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 产品类别 */
    private String productClass;

    /** 编号 */
    private String number;

    /** 市场 */
    private String market;

    /** 变量 */
    private String variable;

    /** 值 */
    private String value;

    /** 字符串1 */
    private String string1;

    /** 字符串2 */
    private String string2;

    /** 注释 */
    private String comments;

    /** 添加日期 */
    private String add;

    /** 删除日期 */
    private String delete;

    /** 用户 */
    private String user;

    /** 日期 */
    private String date;
}
