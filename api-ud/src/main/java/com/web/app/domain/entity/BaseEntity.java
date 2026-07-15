package com.web.app.domain.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 实体基类 - 包含所有实体共有的审计字段
 * 
 * 子类只需关注业务字段，无需重复声明 register/update 审计字段
 */
@Data
/**

 * BaseEntity

 */

public abstract class BaseEntity {

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
