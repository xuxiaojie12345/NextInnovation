package com.web.app.service.impl;

import com.web.app.dto.UD05SelectVariableModificationData;
import com.web.app.dto.UD05SelectVariableModificationItem;
import com.web.app.dto.UD05SelectVariableModificationRequest;
import com.web.app.dto.UD05SelectVariableModificationResponse;
import com.web.app.dto.UD05UpdateHdocAdcaModificationRequest;
import com.web.app.dto.UD05UpdateHdocAdcaModificationResponse;
import com.web.app.mapper.HdocAdcaModificationMapper;
import com.web.app.service.ModifyDocumentService;

import org.apache.commons.lang.StringUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;

/**
 * ModifyDocument サービス実装クラス（ModifyDocument モジュール）
 * ModifyDocument 一覧取得および修正の業務ロジックを実装する
 */
@Service
public class ModifyDocumentServiceImpl implements ModifyDocumentService {

    private static final Logger logger = LogManager.getLogger(ModifyDocumentServiceImpl.class);

    /** 修正成功とみなす最小更新件数 */
    private static final int SUCCESS_UPDATE_COUNT = 1;

    @Autowired
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;

    /**
     * ModifyDocument 一覧取得処理
     *
     * @param request リクエスト (chassisSeries, chassisNo)
     * @return UD05SelectVariableModificationResponse 一覧取得結果レスポンス
     */
    @Override
    public UD05SelectVariableModificationResponse uD05SelectVariableModification(
            UD05SelectVariableModificationRequest request) {
        UD05SelectVariableModificationResponse response = new UD05SelectVariableModificationResponse();

        // 入力パラメータ検証（chassisSeries/chassisNoの必須チェック）
        if (request == null || StringUtils.isBlank(request.getChassisSeries())
                || StringUtils.isBlank(request.getChassisNo())) {
            logger.warn("Invalid UD05SelectVariableModification request parameters: chassisSeries/chassisNo is required");

            response.setCode(400);
            response.setMessage("Chassis series and Chassis no are required.");
            response.setData(null);
            return response;
        }

        logger.info("Calling HdocAdcaModificationMapper.getModifyDocument with series: "
                + request.getChassisSeries() + ", chassisNo: " + request.getChassisNo());

        // HdocAdcaModificationMapperのgetModifyDocumentメソッドを呼び出し、DB照会を行う
        List<UD05SelectVariableModificationItem> modificationList = hdocAdcaModificationMapper
                .getModifyDocument(request.getChassisSeries(), request.getChassisNo());

        if (modificationList != null && !modificationList.isEmpty()) {
            // 取得成功：一覧データをレスポンスに設定
            logger.info("Get modify document data successful. count: " + modificationList.size());

            UD05SelectVariableModificationData data = new UD05SelectVariableModificationData();
            data.setModifyDocumentList(modificationList);

            response.setCode(200);
            response.setMessage("查询成功");
            response.setData(data);
        } else {
            // 取得失敗：対象データなし
            logger.warn("No modify document data found for series: " + request.getChassisSeries()
                    + ", chassisNo: " + request.getChassisNo());

            response.setCode(404);
            response.setMessage("No modification data found.");
            response.setData(null);
        }

        return response;
    }

    /**
     * ModifyDocument 修正処理
     *
     * @param request リクエスト (userId, chassisSeries, chassisNo, modifiedValue)
     * @return UD05UpdateHdocAdcaModificationResponse 修正結果レスポンス
     */
    @Override
    public UD05UpdateHdocAdcaModificationResponse uD05UpdateHdocAdcaModification(
            UD05UpdateHdocAdcaModificationRequest request) {
        UD05UpdateHdocAdcaModificationResponse response = new UD05UpdateHdocAdcaModificationResponse();

        // 入力パラメータ検証（userId/chassisSeries/chassisNo/modifiedValueの必須チェック）
        if (request == null || StringUtils.isBlank(request.getUserId())
                || StringUtils.isBlank(request.getChassisSeries())
                || StringUtils.isBlank(request.getChassisNo())
                || StringUtils.isBlank(request.getModifiedValue())) {
            logger.warn("Invalid UD05UpdateHdocAdcaModification request parameters: "
                    + "userId/chassisSeries/chassisNo/modifiedValue is required");

            response.setCode(400);
            response.setMessage("User id, Chassis series, Chassis no and Modified value are required.");
            response.setData(null);
            return response;
        }

        logger.info("Calling HdocAdcaModificationMapper.updateModifyDocument with series: "
                + request.getChassisSeries() + ", chassisNo: " + request.getChassisNo());

        // HdocAdcaModificationMapperのupdateModifyDocumentメソッドを呼び出し、DB更新を行う
        int updateCount = hdocAdcaModificationMapper.updateModifyDocument(
                request.getUserId(),
                request.getChassisSeries(),
                request.getChassisNo(),
                request.getModifiedValue());

        if (updateCount >= SUCCESS_UPDATE_COUNT) {
            // 更新成功：修正件数が1件以上の場合を修正成功とみなす
            logger.info("Update modify document successful. updateCount: " + updateCount);

            response.setCode(200);
            response.setMessage("修正成功");
            response.setData(new HashMap<String, Object>());
        } else {
            // 更新失敗：更新対象データなし
            logger.warn("Update modify document failed. updateCount: " + updateCount);

            response.setCode(404);
            response.setMessage("No modification data updated.");
            response.setData(null);
        }

        return response;
    }
}
