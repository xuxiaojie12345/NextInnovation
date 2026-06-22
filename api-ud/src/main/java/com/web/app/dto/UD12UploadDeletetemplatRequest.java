package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;
import org.springframework.web.multipart.MultipartFile;

/**
 * UD12 - 上传/删除模板请求DTO
 */
@Data
public class UD12UploadDeletetemplatRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 市场 */
    private String market;

    /** 模板文件名（删除时使用） */
    private String templateName;

    /** 上传文件（上传时使用） */
    private transient MultipartFile file;
}
