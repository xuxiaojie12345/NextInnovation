package com.web.app.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;
import java.util.Date;

/**
 * HDOC_DOCUMENT_LIST 实体类
 * 对应数据库表：HDOC_DOCUMENT_LIST
 * 
 * 功能说明：存储文档类型列表信息
 * 
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HdocDocumentList implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 文档类型（主键）
     * DOCTYPE VARCHAR(20) NOT NULL
     */
    private String doctype;

    /**
     * 描述
     * DESCRIPTION VARCHAR(500) NOT NULL
     */
    private String description;

    /**
     * 注册时间
     * REGISTER_DATETIME DATETIME NOT NULL
     */
    private Date registerDatetime;

    /**
     * 注册用户
     * REGISTER_USER VARCHAR(16) NOT NULL
     */
    private String registerUser;

    /**
     * 注册程序
     * REGISTER_PROCESS VARCHAR(32) NOT NULL
     */
    private String registerProcess;

    /**
     * 更新时间
     * UPDATE_DATETIME DATETIME NOT NULL
     */
    private Date updateDatetime;

    /**
     * 更新用户
     * UPDATE_USER VARCHAR(16) NOT NULL
     */
    private String updateUser;

    /**
     * 更新程序
     * UPDATE_PROCESS VARCHAR(32) NOT NULL
     */
    private String updateProcess;
}
