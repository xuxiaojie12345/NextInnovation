package com.web.app.controller;

import com.web.app.entity.HdocDocumentList;
import com.web.app.mapper.HdocDocumentListMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD22 - Document Types API控制器
 */
@RestController
@RequestMapping("/api/UD22DocumentTypesApi")
@Api(tags = "UD22-Document Types API")
public class UD22DocumentTypesController {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @GetMapping("/document-types")
    @ApiOperation("获取文档类型列表")
    public Map<String, Object> getDocumentTypes() {
        Map<String, Object> result = new HashMap<>();
        try {
            List<HdocDocumentList> documents = hdocDocumentListMapper.selectAllDocumentTypes();
            result.put("code", 200);
            result.put("msg", "查询成功");
            result.put("data", documents);
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "无法加载文档类型列表，请稍后重试");
            result.put("data", null);
        }
        return result;
    }
}
