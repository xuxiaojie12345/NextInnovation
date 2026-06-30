package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * ユーザ機能権限テーブル Entity
 * 对应表：HDOC_FUNCTION_AUTH
 */
@Data
public class HdocFunctionAuth {
    /** 用户ID */
    private String userid;
    /** 功能权限 */
    private String function;
    /** 注册时间 */
    private LocalDateTime registerDatetime;
    /** 注册用户 */
    private String registerUser;
    /** 注册程序 */
    private String registerProcess;
    /** 更新时间 */
    private LocalDateTime updateDatetime;
    /** 更新用户 */
    private String updateUser;
    /** 更新程序 */
    private String updateProcess;
}
