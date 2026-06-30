package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * KOLA受信データ(VARIANT) Entity
 * 对应表：HDOC_REC_DATA_KOLA_VARIANT
 */
@Data
public class HdocRecDataKolaVariant {
    /** 家族ID */
    private String familyId;
    /** 变体ID */
    private String variantId;
    /** 功能组 */
    private String functionGroup;
    /** 符号 */
    private String symbol;
    /** 描述 */
    private String description;
    /** 传输时间戳 */
    private String transTs;
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
