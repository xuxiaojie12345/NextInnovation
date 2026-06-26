package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * 用户市场权限实体类
 * 对应表: HDOC_MARKET_AUTH
 */
@Data
public class HdocMarketAuth implements Serializable {
    private static final long serialVersionUID = 1L;
    
    /**
     * 用户ID
     */
    private String userid;
    
    /**
     * 类型
     */
    private String type;
    
    /**
     * 市场
     */
    private String market;

    /**
     * BU
     */
    private String bu;
}
