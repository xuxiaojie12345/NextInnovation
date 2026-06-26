package com.web.app.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * HDOC_SEND_DATA_VIN_PLATE 实体类
 *
 * VIN Plate数据表
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HdocSendDataVinPlate implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 系列 */
    private String serie;

    /** 底盘号 */
    private String chnr;

    /** 文档就绪标志 */
    private String docReady;

    /** 文档发送标志 */
    private String docSent;

    /** 状态 */
    private String status;

    /** XML文档 */
    private String xmlDoc;

    /** 消息 */
    private String msg;

    /** 类型 */
    private String type;

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
