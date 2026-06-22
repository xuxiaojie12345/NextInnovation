package com.web.app.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;

/**
 * UD04 生成文档数据视图对象
 * 
 * 功能说明：对应UD04多表关联查询的结果集
 * 关联表：HDOC_REC_DATA_VDA_GENERAL, HDOC_REC_DATA_OM, 
 *         HDOC_REC_DATA_KOLA_TIRE_MASTER, HDOC_ADCA_CHANGE, 
 *         HDOC_ADCA_MODIFICATION
 * 
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UD04GenerateDocumentVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 订单号 (来自 HDOC_REC_DATA_OM.ORDERNUMBER)
     */
    private String ordernumber;

    /**
     * 构建周 (来自 HDOC_REC_DATA_OM.BUILD)
     */
    private Integer build;

    /**
     * 规格周 (来自 HDOC_REC_DATA_OM.SPEC)
     */
    private Integer spec;

    /**
     * 客户适配 (来自 HDOC_REC_DATA_OM.CUSTOMER_ADAP)
     */
    private String customerAdap;

    /**
     * 运营国家 (来自 HDOC_REC_DATA_VDA_GENERAL.COUNTRY_OF_OPERATION)
     */
    private String countryOfOperation;

    /**
     * 负载指数 (来自 HDOC_REC_DATA_KOLA_TIRE_MASTER.LOAD_INDEX)
     */
    private String loadIndex;

    /**
     * ACT标志 (来自 HDOC_ADCA_CHANGE.ACT)
     * Y: 活跃, N: 非活跃
     */
    private String act;

    /**
     * 变量 (来自 HDOC_ADCA_MODIFICATION.VARIABLE)
     */
    private String variable;
}
