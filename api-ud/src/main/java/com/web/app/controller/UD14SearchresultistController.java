package com.web.app.controller;

import com.web.app.dto.UD14SearchresultistRequest;
import com.web.app.dto.UD14SearchresultistResponse;
import com.web.app.service.UD14SearchresultistService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD14 - 搜索结果列表API控制器
 */
@RestController
@RequestMapping("/api/UD14SearchresultistApi")
@Api(tags = "UD14-搜索结果列表API")
public class UD14SearchresultistController {

    @Autowired
    private UD14SearchresultistService ud14SearchresultistService;

    @PostMapping("/UD14SelectMarketmaster")
    @ApiOperation("查询市场主数据")
    public UD14SearchresultistResponse selectMarketmaster() {
        return ud14SearchresultistService.selectMarketmaster();
    }

    @PostMapping("/UD14SelectHdocuserdefinedrules")
    @ApiOperation("根据市场查询用户定义规则")
    public UD14SearchresultistResponse selectHdocuserdefinedrules(@RequestBody UD14SearchresultistRequest request) {
        return ud14SearchresultistService.selectHdocuserdefinedrules(request);
    }
}
