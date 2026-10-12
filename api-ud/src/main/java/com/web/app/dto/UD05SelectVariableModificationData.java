package com.web.app.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

/**
 * UD05SelectVariableModification データ DTO
 * ModifyDocument 一覧の取得結果を保持する
 */
@Data
public class UD05SelectVariableModificationData {

    /**
     * ModifyDocument 一覧
     * 備考：レスポンス仕様のJSONキー名（ModifyDocumentList）に合わせて固定する
     */
    @JsonProperty("ModifyDocumentList")
    private List<UD05SelectVariableModificationItem> modifyDocumentList;
}
