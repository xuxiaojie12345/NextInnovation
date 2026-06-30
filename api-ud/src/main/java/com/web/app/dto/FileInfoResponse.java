package com.web.app.dto;

import lombok.Data;

/** UD14: 文件信息响应 */
@Data
public class FileInfoResponse {
    private String fileName;
    private String market;
    private String lastMod;
    private String size;
    private String variable;
}
