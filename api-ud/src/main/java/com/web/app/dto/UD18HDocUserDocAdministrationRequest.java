package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * UD18 - HDoc User Doc Administration请求DTO
 */
@Data
public class UD18HDocUserDocAdministrationRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 用户ID */
    private String userid;

    /** 文档信息列表 */
    private List<Map<String, String>> documents;
}
