package com.web.app.entity;

import java.util.Date;

import lombok.Data;

/**
 * Market主数据实体类
 * 对应表：react_ud.MARKET_MASTER（MARKETマスタテーブル）
 * 命名规则：表名 MARKET_MASTER → 驼峰名 MarketMaster
 */
@Data
public class MarketMaster {

    /** 市场 */
    private String market;

    /** 描述 */
    private String description;

    /** 注册时间 */
    private Date registerDatetime;

    /** 注册用户 */
    private String registerUser;

    /** 注册程序 */
    private String registerProcess;

    /** 更新时间 */
    private Date updateDatetime;

    /** 更新用户 */
    private String updateUser;

    /** 更新程序 */
    private String updateProcess;
}
