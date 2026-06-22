package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;

/**
 * UD06_SelectModificationDetails - 修改详情响应对象
 */
@Data
public class UD06ModificationDetailResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private String doctype;                  // 文档类型
    private String version;                  // 版本号
    private String storingInfo;              // Storing信息（变量名+新值）
    private String foundUnreleasedVersion;   // 是否发现未发布版本（"1"/"0"）
}
