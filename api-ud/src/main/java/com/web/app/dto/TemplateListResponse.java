package com.web.app.dto;

import lombok.Data;
import java.util.List;

/** UD12: 模板列表响应 */
@Data
public class TemplateListResponse {
    private List<TemplateFileInfo> templateFiles;

    @Data
    public static class TemplateFileInfo {
        private String fileName;
        private String market;
    }
}
