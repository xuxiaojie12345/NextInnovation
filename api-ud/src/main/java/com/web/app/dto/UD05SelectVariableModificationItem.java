package com.web.app.dto;

import lombok.Data;

/**
 * UD05SelectVariableModification 明細 DTO
 * ModifyDocument 一覧の1行分（Variable / Description / New value）を保持する
 * 備考：入れ子クラスを作成しないため、明細は独立したDTOクラスとして定義する
 */
@Data
public class UD05SelectVariableModificationItem {

    /**
     * 変数名 (HDOC_ADCA_MODIFICATION.VARIABLE)
     */
    private String variable;

    /**
     * 変数説明 (HDOC_VARIABLES.DESCRIPTION)
     */
    private String description;

    /**
     * 修正値 (HDOC_ADCA_MODIFICATION.NEWVAL)
     */
    private String newval;
}
