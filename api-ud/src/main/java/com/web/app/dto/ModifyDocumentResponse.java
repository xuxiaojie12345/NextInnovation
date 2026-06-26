package com.web.app.dto;

import lombok.Data;

/** UD05: 修改文档响应 */
@Data
public class ModifyDocumentResponse {
    private String variable;
    private String description;
    private String newval;
}
