package com.web.app.dto;

import java.util.Map;

import lombok.Data;

/**
 * UD05UpdateHdocAdcaModification レスポンス DTO
 * ModifyDocument 修正結果をフロントエンドに返すための統一レスポンス形式
 */
@Data
public class UD05UpdateHdocAdcaModificationResponse {

    /**
     * レスポンスコード (200: 成功, 404: 更新対象なし)
     */
    private int code;

    /**
     * レスポンスメッセージ
     */
    private String message;

    /**
     * レスポンスデータ（仕様上は空オブジェクト）
     */
    private Map<String, Object> data;
}
