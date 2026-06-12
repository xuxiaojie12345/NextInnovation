package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * VIN Plate发送数据实体类
 * 对应表: HDOC_SEND_DATA_VIN_PLATE
 */
@Data
public class HdocSendDataVinPlate implements Serializable {
    private static final long serialVersionUID = 1L;
    
    /**
     * Serie
     */
    private String serie;
    
    /**
     * Chassis Number
     */
    private String chnr;
    
    /**
     * 类型
     */
    private Integer type;
    
    /**
     * 状态
     */
    private Integer status;
    
    /**
     * 消息
     */
    private String msg;
    
    /**
     * 注册时间
     */
    private String registerDatetime;
    
    /**
     * 文档就绪
     */
    private Boolean docReady;
    
    /**
     * 文档已发送
     */
    private Boolean docSent;
    
    /**
     * XML文档
     */
    private String xmlDoc;
}
