package com.web.app.controller;

import com.web.app.dto.UD15SelecthdocsenddatavinplateRequest;
import com.web.app.dto.UD15SelecthdocsenddatavinplateResponse;
import com.web.app.service.UD15SelecthdocsenddatavinplateService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD15 VIN Plate数据控制器
 *
 * 功能说明：提供VIN Plate信息查询、状态更新接口
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@RestController
@RequestMapping("/api/ud15")
@Api(tags = "UD15 - VIN Plate数据管理")
public class UD15SelecthdocsenddatavinplateController {

    @Autowired
    private UD15SelecthdocsenddatavinplateService ud15Service;

    @GetMapping("/info")
    @ApiOperation(value = "查看VIN Plate信息", notes = "根据底盘系列和底盘编号查询VIN Plate详细信息")
    public UD15SelecthdocsenddatavinplateResponse viewInfo(
            @RequestParam("chassisSerie") String chassisSerie,
            @RequestParam("chassisNo") String chassisNo) {
        log.info("收到UD15查询VIN Plate信息请求, serie: {}, chnr: {}", chassisSerie, chassisNo);
        UD15SelecthdocsenddatavinplateRequest request = new UD15SelecthdocsenddatavinplateRequest();
        request.setChassisSerie(chassisSerie);
        request.setChassisNo(chassisNo);
        return ud15Service.viewInfo(request);
    }

    @PostMapping("/regenerate")
    @ApiOperation(value = "设置重新生成", notes = "将VIN Plate状态更新为重新生成")
    public UD15SelecthdocsenddatavinplateResponse setRegenerate(
            @RequestBody UD15SelecthdocsenddatavinplateRequest request) {
        log.info("收到UD15设置重新生成请求, serie: {}, chnr: {}", request.getChassisSerie(), request.getChassisNo());
        return ud15Service.setRegenerate(request);
    }

    @PostMapping("/setok")
    @ApiOperation(value = "设置OK状态", notes = "将VIN Plate状态更新为OK")
    public UD15SelecthdocsenddatavinplateResponse setOK(
            @RequestBody UD15SelecthdocsenddatavinplateRequest request) {
        log.info("收到UD15设置OK请求, serie: {}, chnr: {}", request.getChassisSerie(), request.getChassisNo());
        return ud15Service.setOK(request);
    }

    @PostMapping("/changebasic")
    @ApiOperation(value = "切换为基础信息", notes = "将VIN Plate切换为基础信息模式")
    public UD15SelecthdocsenddatavinplateResponse changeToBasicInfo(
            @RequestBody UD15SelecthdocsenddatavinplateRequest request) {
        log.info("收到UD15切换为基础信息请求, serie: {}, chnr: {}", request.getChassisSerie(), request.getChassisNo());
        return ud15Service.changeToBasicInfo(request);
    }

    @PostMapping("/changeadvanced")
    @ApiOperation(value = "切换为高级信息", notes = "将VIN Plate切换为高级信息模式（含weights）")
    public UD15SelecthdocsenddatavinplateResponse changeToAdvancedInfo(
            @RequestBody UD15SelecthdocsenddatavinplateRequest request) {
        log.info("收到UD15切换为高级信息请求, serie: {}, chnr: {}", request.getChassisSerie(), request.getChassisNo());
        return ud15Service.changeToAdvancedInfo(request);
    }
}
