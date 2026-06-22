package com.web.app.controller;

import com.web.app.dto.UD19SearchResultListRequest;
import com.web.app.dto.UD19SearchResultListResponse;
import com.web.app.service.UD19SearchResultListService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD19 - Search Result List API控制器
 */
@RestController
@RequestMapping("/api/UD19SearchResultListApi")
@Api(tags = "UD19-Search Result List API")
public class UD19SearchResultListController {

    @Autowired
    private UD19SearchResultListService ud19SearchResultListService;

    @PostMapping("/search")
    @ApiOperation("搜索HDoc用户")
    public UD19SearchResultListResponse search(@RequestBody UD19SearchResultListRequest request) {
        return ud19SearchResultListService.searchHdoc(request);
    }
}
