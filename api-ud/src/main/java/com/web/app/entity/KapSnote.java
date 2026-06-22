package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * KAP SNOTE实体（UD07-5.6-KAP查询结果）
 */
@Data
public class KapSnote implements Serializable {
    private static final long serialVersionUID = 1L;

    /** S-Note编号 */
    private String snoteNo;

}
