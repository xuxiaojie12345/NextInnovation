package com.web.app.service;

import com.web.app.dto.UD05SelectVariableModificationRequest;
import com.web.app.dto.UD05SelectVariableModificationResponse;
import com.web.app.dto.UD05UpdateHdocAdcaModificationRequest;
import com.web.app.dto.UD05UpdateHdocAdcaModificationResponse;

/**
 * ModifyDocument サービスインターフェース（ModifyDocument モジュール）
 * ModifyDocument 一覧取得および修正のサービスメソッドを定義する
 */
public interface ModifyDocumentService {

    /**
     * ModifyDocument 一覧取得処理
     *
     * @param request リクエスト (chassisSeries, chassisNo)
     * @return UD05SelectVariableModificationResponse 一覧取得結果レスポンス
     */
    UD05SelectVariableModificationResponse uD05SelectVariableModification(
            UD05SelectVariableModificationRequest request);

    /**
     * ModifyDocument 修正処理
     *
     * @param request リクエスト (userId, chassisSeries, chassisNo, modifiedValue)
     * @return UD05UpdateHdocAdcaModificationResponse 修正結果レスポンス
     */
    UD05UpdateHdocAdcaModificationResponse uD05UpdateHdocAdcaModification(
            UD05UpdateHdocAdcaModificationRequest request);
}
