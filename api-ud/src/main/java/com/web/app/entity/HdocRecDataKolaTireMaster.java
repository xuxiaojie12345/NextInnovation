package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * KOLA Tire Master实体类
 * 对应表: HDOC_REC_DATA_KOLA_TIRE_MASTER
 */
@Data
public class HdocRecDataKolaTireMaster implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 系列 */
    private String serie;

    /** 底盘号 */
    private String chnr;

    /** 前轮负载指数 */
    private String frontLoadIndex;

    /** 前轮速度指数 */
    private String frontSpeedIndex;

    /** 驱动轮负载指数 */
    private String driveLoadIndex;

    /** 驱动轮速度指数 */
    private String driveSpeedIndex;
}
