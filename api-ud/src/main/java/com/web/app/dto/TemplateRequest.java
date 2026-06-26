package com.web.app.dto;

import lombok.Data;

/** UD12: 上传/删除模板请求 */
@Data
public class TemplateRequest {
    private String market;
    private String templateFile;
    private String templateName;
}
