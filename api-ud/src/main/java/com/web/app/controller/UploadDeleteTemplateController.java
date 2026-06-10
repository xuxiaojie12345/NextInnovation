package com.web.app.controller;

import com.web.app.dto.UploadDeleteTemplateRequest;
import com.web.app.dto.UploadDeleteTemplateResponse;
import com.web.app.service.UploadDeleteTemplateService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 上传删除模板 Controller
 */
@Api(tags = "UD12UploadDeleteTemplateApi", description = "文件的上传，删除，模板管理")
@RestController
@RequestMapping("/api/ud12")
public class UploadDeleteTemplateController {

    @Autowired
    private UploadDeleteTemplateService uploadDeleteTemplateService;

    /**
     * 上传模板文件
     *
     * @param request 上传请求（包含Base64编码的文件和market）
     * @return 上传响应
     */
    @ApiOperation(value = "上传模板文件", notes = "上传模板文件到服务器")
    @PostMapping(value = "/upload", consumes = "application/json")
    public UploadDeleteTemplateResponse upload(@RequestBody UploadDeleteTemplateRequest request) {
        return uploadDeleteTemplateService.upload(request);
    }

    /**
     * 删除模板文件
     *
     * @param request 删除请求（包含market和templateName）
     * @return 删除响应
     */
    @ApiOperation(value = "删除模板文件", notes = "根据Market和TemplateName删除模板文件")
    @PostMapping(value = "/delete", consumes = "application/json")
    public UploadDeleteTemplateResponse delete(@RequestBody UploadDeleteTemplateRequest request) {
        return uploadDeleteTemplateService.delete(request);
    }

    /**
     * 获取所有Market列表
     *
     * @return Market列表响应
     */
    @ApiOperation(value = "获取Market列表", notes = "获取所有Market名称")
    @GetMapping("/markets")
    public UploadDeleteTemplateResponse getMarkets() {
        return uploadDeleteTemplateService.getMarkets();
    }

    /**
     * 获取指定Market下的模板列表
     *
     * @param market Market名称
     * @return 模板列表响应
     */
    @ApiOperation(value = "获取模板列表", notes = "获取指定Market下的所有模板文件名称")
    @GetMapping("/templates/{market}")
    public UploadDeleteTemplateResponse getTemplates(@PathVariable("market") String market) {
        return uploadDeleteTemplateService.getTemplates(market);
    }
}
