package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * KOLA受信データ(tire master) Entity
 */
@Data
public class HdocRecDataKolaTireMaster implements Serializable {
    private static final long serialVersionUID = 1L;

    private String partno;             // PARTNO - 零件编号
    private String tdim;               // TDIM - TDIM
    private String brand;              // BRAND - 品牌
    private String loadIndex;          // LOAD_INDEX - 负载指数
    private String vpv;                // VPV - VPV
    private String transTs;            // TRANS_TS - 传输时间戳
    private LocalDateTime registerDatetime; // REGISTER_DATETIME - 注册时间
    private String registerUser;       // REGISTER_USER - 注册用户
    private String registerProcess;    // REGISTER_PROCESS - 注册程序
    private LocalDateTime updateDatetime;   // UPDATE_DATETIME - 更新时间
    private String updateUser;         // UPDATE_USER - 更新用户
    private String updateProcess;      // UPDATE_PROCESS - 更新程序
}
