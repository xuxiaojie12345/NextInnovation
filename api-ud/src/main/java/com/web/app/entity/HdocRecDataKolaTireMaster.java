package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * KOLA受信データ(tire master) Entity
 * 对应表：HDOC_REC_DATA_KOLA_TIRE_MASTER
 */
@Data
public class HdocRecDataKolaTireMaster {
    /** 零件编号 */
    private String partno;
    /** TDIM */
    private String tdim;
    /** 品牌 */
    private String brand;
    /** 负载指数 */
    private String loadIndex;
    /** VPV */
    private String vpv;
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
