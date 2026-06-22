package com.web.app.controller;

import com.web.app.dto.UD15SelecthdocsenddatavinplateRequest;
import com.web.app.dto.UD15SelecthdocsenddatavinplateResponse;
import com.web.app.service.UD15SelecthdocsenddatavinplateService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD15 - VIN Plate操作API控制器
 */
@RestController
@RequestMapping("/api/UD15SelecthdocsenddatavinplateApi")
@Api(tags = "UD15-VIN Plate操作API")
public class UD15SelecthdocsenddatavinplateController {

    @Autowired
    private UD15SelecthdocsenddatavinplateService ud15SelecthdocsenddatavinplateService;

    @GetMapping("/UD15ViewInfo")
    @ApiOperation("查看VIN Plate信息")
    public UD15SelecthdocsenddatavinplateResponse viewInfo(UD15SelecthdocsenddatavinplateRequest request) {
        return ud15SelecthdocsenddatavinplateService.viewInfo(request);
    }

    @PostMapping("/UD15SetRegenerate")
    @ApiOperation("设置重新生成")
    public UD15SelecthdocsenddatavinplateResponse setRegenerate(@RequestBody UD15SelecthdocsenddatavinplateRequest request) {
        return ud15SelecthdocsenddatavinplateService.setRegenerate(request);
    }

    @PostMapping("/UD15SetOK")
    @ApiOperation("设置OK")
    public UD15SelecthdocsenddatavinplateResponse setOk(@RequestBody UD15SelecthdocsenddatavinplateRequest request) {
        return ud15SelecthdocsenddatavinplateService.setOk(request);
    }

    @PostMapping("/UD15ChangetoBasicInfo")
    @ApiOperation("切换为基本信息")
    public UD15SelecthdocsenddatavinplateResponse changeToBasicInfo(@RequestBody UD15SelecthdocsenddatavinplateRequest request) {
        return ud15SelecthdocsenddatavinplateService.changeToBasicInfo(request);
    }

    @PostMapping("/UD15ChangetoAdvancedInfo")
    @ApiOperation("切换为高级信息")
    public UD15SelecthdocsenddatavinplateResponse changeToAdvancedInfo(@RequestBody UD15SelecthdocsenddatavinplateRequest request) {
        return ud15SelecthdocsenddatavinplateService.changeToAdvancedInfo(request);
    }
}
