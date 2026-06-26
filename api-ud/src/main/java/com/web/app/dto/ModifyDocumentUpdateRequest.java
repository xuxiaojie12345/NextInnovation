package com.web.app.dto;

import lombok.Data;

/** UD05: 修改文档请求(update) */
@Data
public class ModifyDocumentUpdateRequest {
    private String serie;
    private String chno;
    private String newval;
    private String description;
    private String updateUser;
    private String updateProcess;
}
