package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * KAP SNOTE实体类
 * 对应表: HDOC_REC_DATA_KAP_SNOTE
 */
@Data
public class HdocRecDataKapSnote implements Serializable {
    private static final long serialVersionUID = 1L;

    /** Serie */
    private String serie;

    /** Chassis Number */
    private String chnr;

    /** S-Note编号 */
    private String snoteNo;

    /** 描述 */
    private String description;
}
