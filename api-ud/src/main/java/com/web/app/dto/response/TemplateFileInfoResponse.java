package com.web.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 可用模板文件信息（UD14 List Available Templates）
 * 与前端 ListAvailableTemplates.tsx 的 TemplateFileInfo 对应：
 *   filename / used / lastMod / size
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TemplateFileInfoResponse {
    private String filename;
    private String used;
    private String lastMod;
    private String size;
}
