package com.web.app.controller;

import com.web.app.dto.UD12UploadDeletetemplatRequest;
import com.web.app.dto.UD12UploadDeletetemplatResponse;
import com.web.app.service.UD12UploadDeletetemplatService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * UD12 - 上传/删除模板API控制器
 */
@RestController
@RequestMapping("/api/UD12UploadDeletetemplatApi")
@Api(tags = "UD12-上传/删除模板API")
public class UD12UploadDeletetemplatController {

    @Autowired
    private UD12UploadDeletetemplatService ud12UploadDeletetemplatService;

    @PostMapping("/UD12SelectMarket")
    @ApiOperation("查询市场列表")
    public UD12UploadDeletetemplatResponse selectMarket() {
        return ud12UploadDeletetemplatService.selectMarket();
    }

    @PostMapping("/UD12UploadFlie")
    @ApiOperation("上传模板文件")
    public UD12UploadDeletetemplatResponse uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("market") String market) {
        UD12UploadDeletetemplatRequest request = new UD12UploadDeletetemplatRequest();
        request.setFile(file);
        request.setMarket(market);
        return ud12UploadDeletetemplatService.uploadFile(request);
    }

    @PostMapping("/UD12DeleteFlie")
    @ApiOperation("删除模板文件")
    public UD12UploadDeletetemplatResponse deleteFile(@RequestBody UD12UploadDeletetemplatRequest request) {
        return ud12UploadDeletetemplatService.deleteFile(request);
    }

    @PostMapping("/UD12ListTemplates")
    @ApiOperation("根据市场列出模板文件列表")
    public UD12UploadDeletetemplatResponse listTemplates(@RequestBody UD12UploadDeletetemplatRequest request) {
        return ud12UploadDeletetemplatService.listTemplates(request.getMarket());
    }
}
