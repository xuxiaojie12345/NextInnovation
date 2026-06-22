package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * KAP受信データ(SNOTE) Entity
 */
@Data
public class HdocRecDataKapSnote implements Serializable {
    private static final long serialVersionUID = 1L;

    private String snote;              // SNOTE - SNOTE编号
    private String variantId;          // VARIANT_ID - 变体ID（描述）
    private String transTs;            // TRANS_TS - 传输时间戳
    private LocalDateTime registerDatetime; // REGISTER_DATETIME - 注册时间
    private String registerUser;       // REGISTER_USER - 注册用户
    private String registerProcess;    // REGISTER_PROCESS - 注册程序
    private LocalDateTime updateDatetime;   // UPDATE_DATETIME - 更新时间
    private String updateUser;         // UPDATE_USER - 更新用户
    private String updateProcess;      // UPDATE_PROCESS - 更新程序
}
