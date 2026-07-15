package com.web.app.controller;

import com.web.app.dto.UD04SelectGeneratedocumentResponse;
import com.web.app.service.UD04SelectGeneratedocumentService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * UD04 生成文档数据控制器
 * 
 * 功能说明：提供获取生成文档数据的REST API接口
 * 
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-18
 */
@Slf4j
@RestController
@RequestMapping("/api/ud04")
@Api(tags = "UD04 - 获取生成文档数据")
public class UD04SelectGeneratedocumentController {

    @Autowired
    private UD04SelectGeneratedocumentService ud04Service;

    /**
     * 根据底盘系列和底盘编号获取生成文档数据
     * 对应设计文档 4.1 - 客户端通过GET请求访问接口 /api/ud04/getdocumentdata
     * 
     * 接口说明：
     * - Method: GET
     * - Endpoint: /api/ud04/getdocumentdata
     * - 参数: chassisSerie (底盘系列), chassisNo (底盘编号)
     * - 返回: 生成文档数据（订单号、构建周、规格周等）
     * 
     * 处理流程：
     * 1. 接收前端GET请求及参数
     * 2. 校验参数格式（chassisSerie: 最大5字符，半角英数字；chassisNo: 最大10字符，半角数字）
     * 3. 调用Service层获取生成文档数据
     * 4. 返回标准响应格式
     * 
     * @param chassisSerie 底盘系列（必填，最大5字符，半角英数字）
     * @param chassisNo    底盘编号（必填，最大10字符，半角数字）
     * @return UD04SelectGeneratedocumentResponse 响应对象
     */
    @GetMapping("/getdocumentdata")
    @ApiOperation(value = "获取生成文档数据", notes = "根据底盘系列和底盘编号查询生成文档所需的数据")
    public UD04SelectGeneratedocumentResponse getDocumentData(
            @ApiParam(value = "底盘系列", required = true, example = "ABC12") @RequestParam("chassisSerie") String chassisSerie,

            @ApiParam(value = "底盘编号", required = true, example = "1234567890") @RequestParam("chassisNo") String chassisNo) {

        // 4.3 调用Service层处理业务逻辑
        UD04SelectGeneratedocumentResponse response = ud04Service.getUD04GenerateDocumentData(chassisSerie, chassisNo);

        return response;
    }
}
