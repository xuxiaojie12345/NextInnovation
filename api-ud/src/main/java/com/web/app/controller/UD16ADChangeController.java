package com.web.app.controller;

import com.web.app.dto.UD16ADChangeRequest;
import com.web.app.dto.UD16ADChangeResponse;
import com.web.app.service.UD16ADChangeService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD16 AD/CA变更控制器
 *
 * 功能说明：提供AD/CA变更记录的添加、删除、检查接口
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@RestController
@RequestMapping("/api/ud16")
@Api(tags = "UD16 - AD/CA变更管理")
public class UD16ADChangeController {

    @Autowired
    private UD16ADChangeService ud16Service;

    @PostMapping("/addchange")
    @ApiOperation(value = "添加AD/CA变更", notes = "新增或更新AD/CA变更记录（ACT='Y'）")
    public UD16ADChangeResponse addChange(@RequestBody UD16ADChangeRequest request) {
        log.info("收到UD16添加AD/CA变更请求, serie: {}, chnr: {}", request.getSerie(), request.getChnr());
        return ud16Service.addChange(request);
    }

    @DeleteMapping("/deletechange")
    @ApiOperation(value = "删除AD/CA变更", notes = "删除AD/CA变更记录（ACT='U'）")
    public UD16ADChangeResponse deleteChange(@RequestBody UD16ADChangeRequest request) {
        log.info("收到UD16删除AD/CA变更请求, serie: {}, chnr: {}", request.getSerie(), request.getChnr());
        return ud16Service.deleteChange(request);
    }

    @GetMapping("/checkchange")
    @ApiOperation(value = "检查AD/CA变更", notes = "查询AD/CA变更记录是否存在")
    public UD16ADChangeResponse checkChange(
            @RequestParam("serie") String serie,
            @RequestParam("chnr") String chnr) {
        log.info("收到UD16检查AD/CA变更请求, serie: {}, chnr: {}", serie, chnr);
        UD16ADChangeRequest request = new UD16ADChangeRequest();
        request.setSerie(serie);
        request.setChnr(chnr);
        return ud16Service.checkChange(request);
    }
}
