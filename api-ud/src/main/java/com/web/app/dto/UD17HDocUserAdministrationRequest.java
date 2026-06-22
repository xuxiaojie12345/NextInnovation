package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

/**
 * UD17 - HDoc User Administration请求DTO
 */
@Data
public class UD17HDocUserAdministrationRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 用户ID */
    private String userid;

    /** 权限信息 */
    private List<String> permissions;
}
