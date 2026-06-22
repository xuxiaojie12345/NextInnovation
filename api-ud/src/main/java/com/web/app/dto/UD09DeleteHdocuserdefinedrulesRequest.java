package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * UD09 - 删除用户定义规则请求DTO
 */
@Data
public class UD09DeleteHdocuserdefinedrulesRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 产品类别（查询条件） */
    private String productClass;

    /** 编号（查询条件） */
    private String number;

    /** 市场（查询条件） */
    private String market;

    /** 变量（查询条件） */
    private String variable;

    /** 值（查询条件） */
    private String value;

    /** 字符串1（查询条件） */
    private String string1;

    /** 字符串2（查询条件） */
    private String string2;

    /** 注释（查询条件） */
    private String comments;

    /** 选中的记录列表（删除时使用） */
    private List<Map<String, String>> selectedRecords;
}
