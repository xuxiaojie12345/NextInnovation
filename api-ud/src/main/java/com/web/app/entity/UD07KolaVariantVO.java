package com.web.app.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;

/**
 * UD07 KOLA 变体视图对象
 *
 * 功能说明：映射 HDOC_REC_DATA_KOLA_VARIANT 查询结果
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-22
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UD07KolaVariantVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String symbol;

    private String functionGroup;

    private String description;

    private String familyId;
}
