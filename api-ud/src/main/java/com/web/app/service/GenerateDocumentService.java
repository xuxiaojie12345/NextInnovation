package com.web.app.service;

import com.web.app.dto.UD03SelectHdocdocumentlistResponse;

/**
 * ドキュメント生成サービスインターフェース（GenerateDocument モジュール）
 * DocumentType取得のサービスメソッドを定義する
 */
public interface GenerateDocumentService {

    /**
     * DocumentType取得処理
     *
     * @return UD03SelectHdocdocumentlistResponse DocumentType取得結果レスポンス
     */
    UD03SelectHdocdocumentlistResponse uD03SelectHdocdocumentlist();
}
