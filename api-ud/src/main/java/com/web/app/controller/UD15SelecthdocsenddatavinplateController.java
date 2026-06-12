package com.web.app.controller;

import com.web.app.dto.CommonResponse;
import com.web.app.mapper.HdocSendDataVinPlateMapper;
import com.web.app.entity.HdocSendDataVinPlate;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * UD15 VIN Plate数据API控制器
 */
@RestController
@RequestMapping("/api/UD15SelecthdocsenddatavinplateApi")
@Api(tags = "UD15-VIN Plate数据API")
public class UD15SelecthdocsenddatavinplateController {
    
    @Autowired
    private HdocSendDataVinPlateMapper hdocSendDataVinPlateMapper;
    
    @GetMapping("/UD15ViewInfo")
    @ApiOperation("查看VIN Plate信息")
    public CommonResponse viewInfo(@RequestParam String chassisNumber) {
        // 解析chassisNumber为serie和chnr
        String serie = chassisNumber.substring(0, 4);
        String chnr = chassisNumber.substring(4);
        
        HdocSendDataVinPlate result = hdocSendDataVinPlateMapper.selectByCondition(serie, chnr);
        
        if (result == null) {
            return CommonResponse.error("Chassis number " + chassisNumber + " not found.");
        }
        
        Map<String, Object> data = new HashMap<>();
        data.put("chassisNumber", chassisNumber);
        data.put("type", result.getType());
        data.put("status", result.getStatus());
        data.put("message", result.getMsg());
        data.put("registerDatetime", result.getRegisterDatetime());
        data.put("docReady", result.getDocReady());
        data.put("docSent", result.getDocSent());
        data.put("xmlDoc", result.getXmlDoc());
        
        return CommonResponse.success(data);
    }
    
    @PostMapping("/UD15SetRegenerate")
    @ApiOperation("设置为重新生成")
    public CommonResponse setRegenerate(@RequestBody Map<String, String> params) {
        String chassisNumber = params.get("chassisNumber");
        String serie = chassisNumber.substring(0, 4);
        String chnr = chassisNumber.substring(4);
        
        int result = hdocSendDataVinPlateMapper.updateStatusToRegenerate(serie, chnr);
        if (result > 0) {
            return CommonResponse.success("状态已更新为重新生成", null);
        } else {
            return CommonResponse.error("更新失败");
        }
    }
    
    @PostMapping("/UD15SetOK")
    @ApiOperation("设置为完成")
    public CommonResponse setOk(@RequestBody Map<String, String> params) {
        String chassisNumber = params.get("chassisNumber");
        String serie = chassisNumber.substring(0, 4);
        String chnr = chassisNumber.substring(4);
        
        int result = hdocSendDataVinPlateMapper.updateStatusToOk(serie, chnr);
        if (result > 0) {
            return CommonResponse.success("状态已更新为完成", null);
        } else {
            return CommonResponse.error("更新失败");
        }
    }
    
    @PostMapping("/UD15ChangetoBasicInfo")
    @ApiOperation("更改为基本信息")
    public CommonResponse changeToBasicInfo(@RequestBody Map<String, String> params) {
        String chassisNumber = params.get("chassisNumber");
        String serie = chassisNumber.substring(0, 4);
        String chnr = chassisNumber.substring(4);
        
        int result = hdocSendDataVinPlateMapper.updateToBasicInfo(serie, chnr);
        if (result > 0) {
            return CommonResponse.success("已更改为基本信息", null);
        } else {
            return CommonResponse.error("更新失败");
        }
    }
    
    @PostMapping("/UD15ChangetoAdvancedInfo")
    @ApiOperation("更改为高级信息")
    public CommonResponse changeToAdvancedInfo(@RequestBody Map<String, String> params) {
        String chassisNumber = params.get("chassisNumber");
        String serie = chassisNumber.substring(0, 4);
        String chnr = chassisNumber.substring(4);
        
        int result = hdocSendDataVinPlateMapper.updateToAdvancedInfo(serie, chnr);
        if (result > 0) {
            return CommonResponse.success("已更改为高级信息", null);
        } else {
            return CommonResponse.error("更新失败");
        }
    }
}
