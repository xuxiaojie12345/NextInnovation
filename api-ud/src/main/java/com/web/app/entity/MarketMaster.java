package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * MARKETマスタテーブル Entity
 * 对应表：MARKET_MASTER
 */
@Data
public class MarketMaster {
    /** 市场 */
    private String market;
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
