package com.web.app.service.impl;

import com.web.app.domain.entity.HdocDocumentList;
import com.web.app.dto.UD03SelectHdocdocumentlistData;
import com.web.app.dto.UD03SelectHdocdocumentlistResponse;
import com.web.app.dto.UD04SelectGeneratedocumentData;
import com.web.app.dto.UD04SelectGeneratedocumentRequest;
import com.web.app.dto.UD04SelectGeneratedocumentResponse;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.mapper.HdocRecDataVdaGeneralMapper;
import com.web.app.service.GenerateDocumentService;

import org.apache.commons.lang.StringUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * ドキュメント生成サービス実装クラス（GenerateDocument モジュール）
 * DocumentType取得およびChassis関連データ取得の業務ロジックを実装する
 */
@Service
public class GenerateDocumentServiceImpl implements GenerateDocumentService {

    private static final Logger logger = LogManager.getLogger(GenerateDocumentServiceImpl.class);

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Autowired
    private HdocRecDataVdaGeneralMapper hdocRecDataVdaGeneralMapper;

    /**
     * DocumentType取得処理
     *
     * @return UD03SelectHdocdocumentlistResponse DocumentType取得結果レスポンス
     */
    @Override
    public UD03SelectHdocdocumentlistResponse uD03SelectHdocdocumentlist() {
        UD03SelectHdocdocumentlistResponse response = new UD03SelectHdocdocumentlistResponse();

        logger.info("Calling HdocDocumentListMapper.getDocumentType");

        // HdocDocumentListMapperのgetDocumentTypeメソッドを呼び出し、DB照会を行う
        List<HdocDocumentList> documentList = hdocDocumentListMapper.getDocumentType();

        // ドキュメントタイプリストを構築
        UD03SelectHdocdocumentlistData data = new UD03SelectHdocdocumentlistData();
        List<String> documentTypeList = new ArrayList<>();
        if (documentList != null) {
            for (HdocDocumentList document : documentList) {
                documentTypeList.add(document.getDoctype());
            }
        }
        data.setDocumentTypeList(documentTypeList);

        response.setCode(200);
        response.setMessage("查询成功");
        response.setData(data);

        return response;
    }

    /**
     * Chassis関連データ取得処理
     *
     * @param request リクエスト (chassisSeries, chassisNo)
     * @return UD04SelectGeneratedocumentResponse Chassis関連データ取得結果レスポンス
     */
    @Override
    public UD04SelectGeneratedocumentResponse uD04SelectGeneratedocument(UD04SelectGeneratedocumentRequest request) {
        UD04SelectGeneratedocumentResponse response = new UD04SelectGeneratedocumentResponse();

        // 入力パラメータ検証（chassisSeries/chassisNoの必須チェック）
        if (request == null || StringUtils.isBlank(request.getChassisSeries())
                || StringUtils.isBlank(request.getChassisNo())) {
            logger.warn("Invalid UD04SelectGeneratedocument request parameters: chassisSeries/chassisNo is required");

            response.setCode(400);
            response.setMessage("Chassis series and Chassis no are required.");
            response.setData(null);
            return response;
        }

        logger.info("Calling HdocRecDataVdaGeneralMapper.getChassisData with series: "
                + request.getChassisSeries() + ", chassisNo: " + request.getChassisNo());

        // HdocRecDataVdaGeneralMapperのgetChassisDataメソッドを呼び出し、DB照会を行う
        UD04SelectGeneratedocumentData data = hdocRecDataVdaGeneralMapper.getChassisData(
                request.getChassisSeries(), request.getChassisNo());

        if (data != null) {
            // 取得成功：データをレスポンスに設定
            logger.info("Get chassis data successful for series: " + request.getChassisSeries()
                    + ", chassisNo: " + request.getChassisNo());

            response.setCode(200);
            response.setMessage("查询成功");
            response.setData(data);
        } else {
            // 取得失敗：データなし
            logger.warn("No chassis data found for series: " + request.getChassisSeries()
                    + ", chassisNo: " + request.getChassisNo());

            response.setCode(404);
            response.setMessage("No chassis data found.");
            response.setData(null);
        }

        return response;
    }
}
