package com.web.app.controller;

import com.web.app.dto.CommonResponse;
import com.web.app.mapper.HdocAdcaChangeMapper;
import com.web.app.entity.HdocAdcaChange;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * UD16 AD变更API控制器
 */
@RestController
@RequestMapping("/api/UD16ADChangeApi")
@Api(tags = "UD16-AD变更API")
public class UD16ADChangeController {
    
    @Autowired
    private HdocAdcaChangeMapper hdocAdcaChangeMapper;
    
    @PostMapping("/UD16SelectHdocAdcaChange")
    @ApiOperation("查询ADCA变更")
    public CommonResponse select(@RequestBody Map<String, String> params) {
        String serie = params.get("serie_chnr");
        String chnr = params.get("desc");
        
        HdocAdcaChange result = hdocAdcaChangeMapper.selectByCondition(serie, chnr);
        
        if (result != null) {
            return CommonResponse.success("没有错误", result);
        } else {
            return CommonResponse.error("数据不存在");
        }
    }
    
    @PostMapping("/UD16InsertHdocAdcaChange")
    @ApiOperation("新增ADCA变更")
    public CommonResponse insert(@RequestBody Map<String, String> params) {
        String serie = params.get("serie_chnr");
        String chnr = params.get("desc");
        
        // 检查是否已存在
        HdocAdcaChange existing = hdocAdcaChangeMapper.selectByCondition(serie, chnr);
        if (existing != null) {
            return CommonResponse.error("记录已存在");
        }
        
        HdocAdcaChange adcaChange = new HdocAdcaChange();
        adcaChange.setSerie(serie);
        adcaChange.setChnr(chnr);
        adcaChange.setReason(params.get("reason"));
        adcaChange.setRegisterUser(params.get("user"));
        
        int result = hdocAdcaChangeMapper.insert(adcaChange);
        if (result > 0) {
            return CommonResponse.success("追加成功", null);
        } else {
            return CommonResponse.error("追加失败");
        }
    }
    
    @PostMapping("/UD16UpdateHdocAdcaChange")
    @ApiOperation("删除ADCA变更（逻辑删除）")
    public CommonResponse update(@RequestBody Map<String, String> params) {
        String serie = params.get("serie_chnr");
        String chnr = params.get("desc");
        
        // 检查是否存在
        HdocAdcaChange existing = hdocAdcaChangeMapper.selectByCondition(serie, chnr);
        if (existing == null) {
            return CommonResponse.error("记录不存在");
        }
        
        int result = hdocAdcaChangeMapper.updateActToN(serie, chnr);
        if (result > 0) {
            return CommonResponse.success("删除成功", null);
        } else {
            return CommonResponse.error("删除失败");
        }
    }
}
