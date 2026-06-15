package com.web.app.domain.Entity;

import lombok.Data;

/**
 * Market Master Entity
 * 市场主数据实体类，对应 MARKET_MASTER 表
 */
@Data
public class MarketMaster {
    private String market;          // Market code
    private String description;     // Market description
}
