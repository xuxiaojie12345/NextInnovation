package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * KOLA Variant Symbol实体（UD07-5.6-2查询结果）
 */
@Data
public class KolaVariantSymbol implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 格式化后的Symbol字符串（前8位，右侧补空格） */
    private String symbolStr;

    /** 功能组 */
    private String functionGroup;
}
