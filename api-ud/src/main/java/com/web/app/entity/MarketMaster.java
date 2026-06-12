package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * 市场主数据实体类
 * 对应表: MARKET_MASTER
 */
@Data
public class MarketMaster implements Serializable {
    private static final long serialVersionUID = 1L;
    
    /**
     * 市场代码
     */
    private String market;
    
    /**
     * 描述
     */
    private String description;
}
