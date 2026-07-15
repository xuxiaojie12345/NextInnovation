package com.web.app.controller;

import com.web.app.dto.UD12UploadDeletetemplatRequest;
import com.web.app.dto.UD12UploadDeletetemplatResponse;
import com.web.app.service.UD12UploadDeletetemplatService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * UD12 上传删除模板控制器
 *
 * 功能说明：提供市场列表查询、模板文件上传、删除接口
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@RestController
@RequestMapping("/api/ud12")
@Api(tags = "UD12 - 上传删除模板管理")
public class UD12UploadDeletetemplatController {

    @Autowired
    private UD12UploadDeletetemplatService ud12Service;

    @GetMapping("/selectmarket")
    @ApiOperation(value = "获取市场列表", notes = "查询所有市场MARKET列表")
    public UD12UploadDeletetemplatResponse selectMarket() {
        return ud12Service.UD12SelectMarket();
    }

    @PostMapping("/uploadflie")
    @ApiOperation(value = "上传模板文件", notes = "上传RTF模板文件到服务器")
    public UD12UploadDeletetemplatResponse uploadFile(
            @ApiParam(value = "RTF文件", required = true) @RequestParam("file") MultipartFile file,
            @ApiParam(value = "市场", required = true, example = "JP") @RequestParam("market") String market) {
        return ud12Service.UD12UploadFlie(file, market);
    }

    @GetMapping("/template/list")
    @ApiOperation(value = "获取模板文件列表", notes = "根据市场获取该Market文件夹下的所有模板文件名")
    public UD12UploadDeletetemplatResponse getTemplateList(
            @ApiParam(value = "市场", required = true, example = "AF") @RequestParam("market") String market) {
        return ud12Service.getTemplateList(market);
    }

    @DeleteMapping("/deleteflie")
    @ApiOperation(value = "删除模板文件", notes = "从服务器删除指定市场的模板文件")
    public UD12UploadDeletetemplatResponse deleteFile(
            @ApiParam(value = "市场", required = true, example = "JP") @RequestParam("market") String market,
            @ApiParam(value = "模板文件名", required = true, example = "template.rtf") @RequestParam("template") String template) {
        UD12UploadDeletetemplatRequest request = new UD12UploadDeletetemplatRequest();
        request.setMarket(market);
        request.setTemplate(template);
        return ud12Service.UD12DeleteFlie(request);
    }
}
