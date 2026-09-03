package com.web.app.dto;

import java.util.List;

import lombok.Data;

/**
 * UD03SelectHdocdocumentlistデータ DTO
 * DocumentType取得時のレスポンスデータを保持する
 */
@Data
public class UD03SelectHdocdocumentlistData {

    /**
     * ドキュメントタイプリスト
     */
    private List<String> documentTypeList;
}
