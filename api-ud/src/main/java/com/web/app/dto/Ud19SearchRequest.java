package com.web.app.dto;

import lombok.Data;

/** UD19: 检索请求 */
@Data
public class Ud19SearchRequest {
    private String userid;
    private String userName;
    private String type;
    private String market;
}
