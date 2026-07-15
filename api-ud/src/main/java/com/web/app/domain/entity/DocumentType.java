package com.web.app.domain.entity;


/**
 * HDOC_DOCUMENT_LIST表对应的实体类
 */
public class DocumentType extends BaseEntity {
    
    private String doctype;
    private String description;

    // 默认构造函数
    public DocumentType() {
    }

    // Getter和Setter方法
    public String getDoctype() {
        return doctype;
    }

    public void setDoctype(String doctype) {
        this.doctype = doctype;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}