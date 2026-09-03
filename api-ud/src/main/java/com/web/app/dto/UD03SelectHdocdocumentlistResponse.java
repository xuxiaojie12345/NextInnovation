package com.web.app.dto;

import lombok.Data;

/**
 * UD03SelectHdocdocumentlistレスポンス DTO
 * DocumentType取得結果をフロントエンドに返すための統一レスポンス形式
 */
@Data
public class UD03SelectHdocdocumentlistResponse {

    /**
     * レスポンスコード (200: 成功)
     */
    private int code;

    /**
     * レスポンスメッセージ
     */
    private String message;

    /**
     * レスポンスデータ（DocumentTypeリスト）
     */
    private UD03SelectHdocdocumentlistData data;
}
