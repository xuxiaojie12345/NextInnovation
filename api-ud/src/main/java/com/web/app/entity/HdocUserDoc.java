package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * HDOC_USER_DOC Entity
 */
@Data
public class HdocUserDoc {
    /** 用户ID */
    private String userid;
    /** 文档类型 */
    private String doctype;
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
