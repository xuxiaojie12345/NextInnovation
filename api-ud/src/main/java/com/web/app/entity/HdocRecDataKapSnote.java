package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * KAP受信データ(SNOTE) Entity
 * 对应表：HDOC_REC_DATA_KAP_SNOTE
 */
@Data
public class HdocRecDataKapSnote {
    /** SNOTE */
    private String snote;
    /** VARIANT_ID */
    private String variantId;
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
