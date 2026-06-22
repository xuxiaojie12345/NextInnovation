package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD14 - 搜索结果列表请求DTO
 */
@Data
public class UD14SearchresultistRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 市场 */
    private String market;
}
