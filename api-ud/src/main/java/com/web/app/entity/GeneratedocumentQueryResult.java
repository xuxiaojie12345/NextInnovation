package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * UD04 - Generate document联合查询结果实体（5.3 SQL用）
 */
@Data
public class GeneratedocumentQueryResult implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 订单号 */
    private String ordernumber;

    /** 生产周 */
    private String build;

    /** Spec周 */
    private String spec;

    /** S-Note编号（OM.CUSTOMER_ADAP） */
    private String sNoteNO;

    /** 市场（GENERAL.COUNTRY_OF_OPERATION） */
    private String market;

    /** 负载指数 */
    private String loadIndex;

    /** ADCA Change活动状态 */
    private String act;

    /** 修改变量 */
    private String variable;

    /** 修改新值 */
    private String newval;
}
