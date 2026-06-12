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
 * UD05 修改文档API控制器
 */
@RestController
@RequestMapping("/api/UD05ModifyDocumentApi")
@Api(tags = "UD05-修改文档API")
public class UD05ModifyDocumentController {
    
    @Autowired
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;
    
    @PostMapping("/UD05SelectVariableModification")
    @ApiOperation("查询变量修改信息")
    public CommonResponse selectVariableModification(@RequestBody Map<String, String> params) {
        String serie = params.get("SERIE");
        String chno = params.get("CHNO");
        
        List<HdocAdcaModification> result = hdocAdcaModificationMapper.selectByCondition(serie, chno);
        
        if (result == null || result.isEmpty()) {
            return CommonResponse.error("数据不存在");
        }
        
        return CommonResponse.success(result);
    }
    
    @PostMapping("/UD05UpdateHdocAdcaModification")
    @ApiOperation("更新ADCA修改信息")
    public CommonResponse updateHdocAdcaModification(@RequestBody Map<String, String> params) {
        String serie = params.get("SERIE");
        String chno = params.get("CHNO");
        String description = params.get("DESCRIPTION");
        String modifiedValue = params.get("modifiedValue");
        
        int result = hdocAdcaModificationMapper.updateNewVal(serie, chno, description, modifiedValue);
        
        if (result > 0) {
            return CommonResponse.success("更新成功", null);
        } else {
            return CommonResponse.error("更新失败");
        }
    }
}
