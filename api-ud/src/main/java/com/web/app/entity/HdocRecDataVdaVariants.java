package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * VDA受信データ(VARIANTS INFO) Entity
 * 对应表：HDOC_REC_DATA_VDA_VARIANTS
 */
@Data
public class HdocRecDataVdaVariants {
    /** 系列 */
    private String serie;
    /** 频道编号 */
    private String chnr;
    /** 车辆识别码 */
    private String vin;
    /** 家族ID */
    private String familyId;
    /** 变体ID */
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
