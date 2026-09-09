package com.web.app.controller;

import com.web.app.dto.UD03SelectHdocdocumentlistResponse;
import com.web.app.dto.UD04SelectGeneratedocumentRequest;
import com.web.app.dto.UD04SelectGeneratedocumentResponse;
import com.web.app.service.GenerateDocumentService;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

/**
 * ドキュメント生成コントローラー（GenerateDocument モジュール）
 * DocumentType取得およびChassis関連データ取得リクエストを処理する
 */
@RestController
@RequestMapping("/api/GenerateDocument")
@Api(tags = "GenerateDocument API")
public class GenerateDocumentController {

    private static final Logger logger = LogManager.getLogger(GenerateDocumentController.class);

    @Autowired
    private GenerateDocumentService generateDocumentService;

    /**
     * DocumentType取得API
     *
     * @return UD03SelectHdocdocumentlistResponse DocumentType取得結果
     */
    @PostMapping("/UD03SelectHdocdocumentlist")
    @ApiOperation("DocumentType取得")
    public UD03SelectHdocdocumentlistResponse uD03SelectHdocdocumentlist() {
        logger.info("UD03SelectHdocdocumentlist request received");

        UD03SelectHdocdocumentlistResponse response;
        try {
            // Service層のuD03SelectHdocdocumentlistメソッドを呼び出し、取得処理を行う
            response = generateDocumentService.uD03SelectHdocdocumentlist();
        } catch (Exception e) {
            logger.error("UD03SelectHdocdocumentlist error: " + e.getMessage(), e);
            response = new UD03SelectHdocdocumentlistResponse();
            response.setCode(500);
            response.setMessage("System error. Please contact support.");
            response.setData(null);
        }

        logger.info("UD03SelectHdocdocumentlist response code: " + response.getCode());
        return response;
    }

    /**
     * Chassis関連データ取得API
     *
     * @param request リクエストパラメータ (chassisSeries, chassisNo)
     * @return UD04SelectGeneratedocumentResponse Chassis関連データ取得結果
     */
    @PostMapping("/UD04SelectGeneratedocument")
    @ApiOperation("Chassis関連データ取得")
    public UD04SelectGeneratedocumentResponse uD04SelectGeneratedocument(
            @RequestBody UD04SelectGeneratedocumentRequest request) {
        logger.info("UD04SelectGeneratedocument request received for chassisSeries: "
                + request.getChassisSeries());

        UD04SelectGeneratedocumentResponse response;
        try {
            // Service層のuD04SelectGeneratedocumentメソッドを呼び出し、取得処理を行う
            response = generateDocumentService.uD04SelectGeneratedocument(request);
        } catch (Exception e) {
            logger.error("UD04SelectGeneratedocument error: " + e.getMessage(), e);
            response = new UD04SelectGeneratedocumentResponse();
            response.setCode(500);
            response.setMessage("System error. Please contact support.");
            response.setData(null);
        }

        logger.info("UD04SelectGeneratedocument response code: " + response.getCode());
        return response;
    }
}
