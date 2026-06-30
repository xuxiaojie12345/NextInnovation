package com.web.app.dto;

import lombok.Data;

/** UD17: 用户信息响应 */
@Data
public class UserInfoResponse {
    private String userId;
    private String userName;
    private String type;
    private String market;
    private String function;
}
