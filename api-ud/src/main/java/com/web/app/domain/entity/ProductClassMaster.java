package com.web.app.domain.entity;


/**
 * PRODUCT_CLASS_MASTER表对应的实体类
 */
 /**

  * ProductClassMaster

  */

public class ProductClassMaster extends BaseEntity {

/** pc */

    private String pc;
    /** description */

    private String description;

    public ProductClassMaster() {
    }

    public String getPc() {
        return pc;
    }

    public void setPc(String pc) {
        this.pc = pc;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
