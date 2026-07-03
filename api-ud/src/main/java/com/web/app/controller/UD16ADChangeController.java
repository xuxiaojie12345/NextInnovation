package com.web.app.controller;

import com.web.app.dto.UD16ADChangeRequest;
import com.web.app.dto.UD16ADChangeResponse;
import com.web.app.service.UD16ADChangeService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD16 - AD Change操作API控制器
 */
@RestController
@RequestMapping("/api/UD16ADChangeApi")
@Api(tags = "UD16-AD Change操作API")
public class UD16ADChangeController {

    @Autowired
    private UD16ADChangeService ud16ADChangeService;

    @PostMapping("/UD16SelectHdocAdcaChange")
    @ApiOperation("检查ADCA Change")
    public UD16ADChangeResponse selectHdocAdcaChange(@RequestBody UD16ADChangeRequest request) {
        return ud16ADChangeService.selectHdocAdcaChange(request);
    }

    @PostMapping("/UD16InsertHdocAdcaChange")
    @ApiOperation("追加ADCA Change")
    public UD16ADChangeResponse insertHdocAdcaChange(@RequestBody UD16ADChangeRequest request) {
        return ud16ADChangeService.insertHdocAdcaChange(request);
    }

    @PostMapping("/UD16UpdateHdocAdcaChange")
    @ApiOperation("删除ADCA Change")
    public UD16ADChangeResponse updateHdocAdcaChange(@RequestBody UD16ADChangeRequest request) {
        return ud16ADChangeService.updateHdocAdcaChange(request);
    }

    @PostMapping("/UD16DeleteHdocAdcaChange")
    @ApiOperation("物理删除ADCA Change")
    public UD16ADChangeResponse deleteHdocAdcaChange(@RequestBody UD16ADChangeRequest request) {
        return ud16ADChangeService.deleteHdocAdcaChange(request);
    }
}
