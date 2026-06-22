package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;

/**
 * 文档类型列表响应对象
 */
@Data
public class DoctypeListResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private String doctype;  // 文档类型
}
