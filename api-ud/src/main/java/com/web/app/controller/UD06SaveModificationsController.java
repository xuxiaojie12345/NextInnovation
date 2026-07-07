package com.web.app.controller;

import com.web.app.dto.UD06SaveModificationsRequest;
import com.web.app.dto.UD06SaveModificationsResponse;
import com.web.app.service.UD06SaveModificationsService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * UD06 保存修改内容控制器
 *
 * 功能说明：提供保存修改内容查询的REST API接口
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-22
 */
@Slf4j
@RestController
@RequestMapping("/api/ud06")
@Api(tags = "UD06 - 保存修改内容")
public class UD06SaveModificationsController {

    @Autowired
    private UD06SaveModificationsService ud06Service;

    @GetMapping("/savemodifications")
    @ApiOperation(value = "查询保存修改内容", notes = "根据底盘系列和底盘编号查询UD06保存修改内容数据")
    public UD06SaveModificationsResponse getSaveModifications(
            @ApiParam(value = "底盘系列", required = true, example = "JPCT") @RequestParam("chassisSerie") String chassisSerie,
            @ApiParam(value = "底盘编号", required = true, example = "028321") @RequestParam("chassisNo") String chassisNo) {

        log.info("收到UD06查询请求(GET)，chassisSerie: {}, chassisNo: {}", chassisSerie, chassisNo);

        final UD06SaveModificationsRequest request = new UD06SaveModificationsRequest();
        UD06SaveModificationsResponse response = ud06Service.UD06SelectHdocAdcaModification(request);

        log.info("UD06查询返回，code: {}, msg: {}", response.getCode(), response.getMsg());
        return response;
    }

    @PostMapping("/savemodifications")
    @ApiOperation(value = "查询保存修改内容", notes = "根据底盘系列和底盘编号查询UD06保存修改内容数据")
    public UD06SaveModificationsResponse postSaveModifications(
            @RequestBody UD06SaveModificationsRequest request) {

        log.info("收到UD06查询请求(POST)，request: {}", request);

        UD06SaveModificationsResponse response = ud06Service.UD06SelectHdocAdcaModification(request);

        log.info("UD06查询返回，code: {}, msg: {}", response.getCode(), response.getMsg());
        return response;
    }
}
