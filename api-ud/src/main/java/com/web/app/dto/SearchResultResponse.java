package com.web.app.dto;

import lombok.Data;

/** UD19: 检索结果响应 */
@Data
public class SearchResultResponse {
    private String userId;
    private String userName;
    private String market;
}
