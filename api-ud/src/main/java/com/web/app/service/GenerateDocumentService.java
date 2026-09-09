package com.web.app.service;

import com.web.app.dto.UD03SelectHdocdocumentlistResponse;
import com.web.app.dto.UD04SelectGeneratedocumentRequest;
import com.web.app.dto.UD04SelectGeneratedocumentResponse;

/**
 * ドキュメント生成サービスインターフェース（GenerateDocument モジュール）
 * DocumentType取得およびChassis関連データ取得のサービスメソッドを定義する
 */
public interface GenerateDocumentService {

    /**
     * DocumentType取得処理
     *
     * @return UD03SelectHdocdocumentlistResponse DocumentType取得結果レスポンス
     */
    UD03SelectHdocdocumentlistResponse uD03SelectHdocdocumentlist();

    /**
     * Chassis関連データ取得処理
     *
     * @param request リクエスト (chassisSeries, chassisNo)
     * @return UD04SelectGeneratedocumentResponse Chassis関連データ取得結果レスポンス
     */
    UD04SelectGeneratedocumentResponse uD04SelectGeneratedocument(UD04SelectGeneratedocumentRequest request);
}
