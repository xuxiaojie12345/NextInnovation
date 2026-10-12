package com.web.app.controller;

import com.web.app.dto.UD05SelectVariableModificationRequest;
import com.web.app.dto.UD05SelectVariableModificationResponse;
import com.web.app.dto.UD05UpdateHdocAdcaModificationRequest;
import com.web.app.dto.UD05UpdateHdocAdcaModificationResponse;
import com.web.app.service.ModifyDocumentService;

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
 * ドキュメント修正コントローラー（ModifyDocument モジュール）
 * ModifyDocument 一覧取得および修正リクエストを処理する
 */
@RestController
@RequestMapping("/api/ModifyDocument")
@Api(tags = "ModifyDocument API")
public class ModifyDocumentController {

    private static final Logger logger = LogManager.getLogger(ModifyDocumentController.class);

    @Autowired
    private ModifyDocumentService modifyDocumentService;

    /**
     * ModifyDocument 一覧取得API
     *
     * @param request リクエストパラメータ (chassisSeries, chassisNo)
     * @return UD05SelectVariableModificationResponse 一覧取得結果
     */
    @PostMapping("/UD05SelectVariableModification")
    @ApiOperation("ModifyDocument一覧取得")
    public UD05SelectVariableModificationResponse uD05SelectVariableModification(
            @RequestBody UD05SelectVariableModificationRequest request) {
        logger.info("UD05SelectVariableModification request received for chassisSeries: "
                + (request != null ? request.getChassisSeries() : null));

        UD05SelectVariableModificationResponse response;
        try {
            // Service層のuD05SelectVariableModificationメソッドを呼び出し、取得処理を行う
            response = modifyDocumentService.uD05SelectVariableModification(request);
        } catch (Exception e) {
            logger.error("UD05SelectVariableModification error: " + e.getMessage(), e);
            response = new UD05SelectVariableModificationResponse();
            response.setCode(500);
            response.setMessage("System error. Please contact support.");
            response.setData(null);
        }

        logger.info("UD05SelectVariableModification response code: " + response.getCode());
        return response;
    }

    /**
     * ModifyDocument 修正API
     *
     * @param request リクエストパラメータ (userId, chassisSeries, chassisNo, modifiedValue)
     * @return UD05UpdateHdocAdcaModificationResponse 修正結果
     */
    @PostMapping("/UD05UpdateHdocAdcaModification")
    @ApiOperation("ModifyDocument修正")
    public UD05UpdateHdocAdcaModificationResponse uD05UpdateHdocAdcaModification(
            @RequestBody UD05UpdateHdocAdcaModificationRequest request) {
        logger.info("UD05UpdateHdocAdcaModification request received for chassisSeries: "
                + (request != null ? request.getChassisSeries() : null));

        UD05UpdateHdocAdcaModificationResponse response;
        try {
            // Service層のuD05UpdateHdocAdcaModificationメソッドを呼び出し、修正処理を行う
            response = modifyDocumentService.uD05UpdateHdocAdcaModification(request);
        } catch (Exception e) {
            logger.error("UD05UpdateHdocAdcaModification error: " + e.getMessage(), e);
            response = new UD05UpdateHdocAdcaModificationResponse();
            response.setCode(500);
            response.setMessage("System error. Please contact support.");
            response.setData(null);
        }

        logger.info("UD05UpdateHdocAdcaModification response code: " + response.getCode());
        return response;
    }
}
