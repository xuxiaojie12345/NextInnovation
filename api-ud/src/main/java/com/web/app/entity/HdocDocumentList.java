package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * 文档类型实体类
 * 对应表: HDOC_DOCUMENT_LIST
 */
@Data
public class HdocDocumentList implements Serializable {
    private static final long serialVersionUID = 1L;
    
    /**
     * 文档类型
     */
    private String doctype;
    
    /**
     * 描述
     */
    private String description;
    
    /**
     * 注册用户
     */
    private String registerUser;
    
    /**
     * 注册时间
     */
    private String registerDatetime;
}
