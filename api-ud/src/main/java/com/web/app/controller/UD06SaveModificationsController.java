package com.web.app.controller;

import com.web.app.dto.CommonResponse;
import com.web.app.mapper.HdocAdcaModificationMapper;
import com.web.app.entity.HdocAdcaModification;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD06 保存修改API控制器
 */
@RestController
@RequestMapping("/api/UD06SaveModificationsApi")
@Api(tags = "UD06-保存修改API")
public class UD06SaveModificationsController {
    
    @Autowired
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;
    
    @PostMapping("/UD06SelectHdocAdcaModification")
    @ApiOperation("查询ADCA修改信息")
    public CommonResponse selectHdocAdcaModification(@RequestBody Map<String, String> params) {
        String chassisSerie = params.get("ChassisSerie");
        String chassisNumber = params.get("ChassisNumber");
        
        List<HdocAdcaModification> result = hdocAdcaModificationMapper.selectByCondition(chassisSerie, chassisNumber);
        
        if (result == null || result.isEmpty()) {
            return CommonResponse.error("数据不存在");
        }
        
        return CommonResponse.success(result);
    }
}
