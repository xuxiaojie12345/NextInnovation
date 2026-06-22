package com.web.app.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;

/**
 * UD05 修改文档变量视图对象
 *
 * 功能说明：对应 HDOC_ADCA_MODIFICATION 与 HDOC_VARIABLES 的查询结果
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UD05ModifyDocumentVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String chassisSerie;
    private String chassisNo;
    private String variable;
    private String description;
    private String oldVal;
    private String newVal;
    private String sta;
}
