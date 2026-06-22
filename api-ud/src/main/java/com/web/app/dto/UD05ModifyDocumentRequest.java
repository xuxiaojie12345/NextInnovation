package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD05 - Modify Document请求DTO
 * Select: serie, chno
 * Update: serie, chno, description, modifiedValue
 */
@Data
public class UD05ModifyDocumentRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** Serie */
    private String serie;

    /** Chassis Number */
    private String chno;

    /** 描述（Update时使用） */
    private String description;

    /** 修改后的值（Update时使用） */
    private String modifiedValue;
}
