package com.web.app.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * PRODUCT_CLASS_MASTER 实体类
 *
 * 产品类别主数据表
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductClassMaster implements Serializable {

    private static final long serialVersionUID = 1L;

    /** PC代码 */
    private String pc;

    /** 描述 */
    private String description;

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
