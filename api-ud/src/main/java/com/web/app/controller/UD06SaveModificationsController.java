package com.web.app.controller;

import com.web.app.dto.UD06SaveModificationsRequest;
import com.web.app.dto.UD06SaveModificationsResponse;
import com.web.app.service.UD06SaveModificationsService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * UD06 - Save Modifications查询API控制器
 */
@RestController
@RequestMapping("/api/UD06SaveModificationsApi")
@Api(tags = "UD06-Save Modifications查询API")
public class UD06SaveModificationsController {

    @Autowired
    private UD06SaveModificationsService ud06SaveModificationsService;

    @PostMapping("/UD06SelectHdocAdcaModification")
    @ApiOperation("查询HDoc ADCA Modification信息")
    public UD06SaveModificationsResponse selectHdocAdcaModification(@RequestBody UD06SaveModificationsRequest request) {
        return ud06SaveModificationsService.selectHdocAdcaModification(request);
    }
}
