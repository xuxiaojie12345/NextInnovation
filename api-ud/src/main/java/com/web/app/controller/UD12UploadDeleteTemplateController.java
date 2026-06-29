package com.web.app.controller;

import com.web.app.dto.UD12UploadDeleteTemplateResponse;
import com.web.app.service.UD12UploadDeleteTemplateService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * UD12 Upload&Delete Template 控制器
 * 
 * 提供以下接口：
 * - GET  /admin/Upload&DeleteTemplate/getMarket    获取市场列表
 * - POST /admin/Upload&DeleteTemplate/uploadFile   上传模板文件
 * - GET  /admin/Upload&DeleteTemplate/getFileList  获取指定 Market 下的文件列表
 * - DELETE /admin/Upload&DeleteTemplate/deleteFile 删除指定文件
 * 
 * 所有接口返回统一格式：
 * {
 *   "code": 200,
 *   "message": "success",
 *   "data": { ... }
 * }
 */
@Api(tags = "UD12 - Upload&Delete Template 管理")
@RestController
@RequestMapping("/admin/Upload&DeleteTemplate")
public class UD12UploadDeleteTemplateController {

    private static final Logger logger = LogManager.getLogger(UD12UploadDeleteTemplateController.class);

    @Autowired
    private UD12UploadDeleteTemplateService ud12UploadDeleteTemplateService;

    /**
     * 获取市场列表
     * 根据内部设计文档 3.1.1：画面初始化时加载 Market 列表数据
     * 对应前端 API：axios.get('/admin/Upload&DeleteTemplate/getMarket')
     *
     * @return 统一响应对象，data 包含市场列表
     */
    @ApiOperation("获取市场列表")
    @GetMapping("/getMarket")
    public UD12UploadDeleteTemplateResponse getMarkets() {
        logger.info("Received request: GET /getMarket");
        return ud12UploadDeleteTemplateService.getMarkets();
    }

    /**
     * 上传模板文件
     * 根据内部设计文档 3.1.3：文件上传流程
     * 对应前端 API：axios.post('/admin/Upload&DeleteTemplate/uploadFile', formData)
     *
     * @param file   上传的模板文件（MultipartFile）
     * @param market 目标市场代码
     * @return 统一响应对象
     */
    @ApiOperation("上传模板文件")
    @PostMapping("/uploadFile")
    public UD12UploadDeleteTemplateResponse uploadFile(
            @RequestParam("Template File") MultipartFile file,
            @RequestParam("Market") String market) {
        logger.info("Received request: POST /uploadFile, market={}, fileName={}",
                market, file.getOriginalFilename());
        return ud12UploadDeleteTemplateService.uploadFile(file, market);
    }

    /**
     * 获取指定 Market 下的文件列表
     * 根据内部设计文档 3.1.4：Market 选择变化时加载模板文件列表
     * 对应前端 API：axios.get('/admin/Upload&DeleteTemplate/getFileList', { params: { Market: market } })
     *
     * @param market 市场代码
     * @return 统一响应对象，data 包含文件列表
     */
    @ApiOperation("获取指定Market下的文件列表")
    @GetMapping("/getFileList")
    public UD12UploadDeleteTemplateResponse getFileList(@RequestParam("Market") String market) {
        logger.info("Received request: GET /getFileList, market={}", market);
        return ud12UploadDeleteTemplateService.getFileList(market);
    }

    /**
     * 删除指定 Market 下的模板文件
     * 根据内部设计文档 3.1.5：文件删除流程
     * 对应前端 API：axios.delete('/admin/Upload&DeleteTemplate/deleteFile', { data: { ... } })
     *
     * @param requestBody 请求体，包含 "Template File" 和 "Market" 字段
     * @return 统一响应对象
     */
    @ApiOperation("删除指定Market下的模板文件")
    @DeleteMapping("/deleteFile")
    public UD12UploadDeleteTemplateResponse deleteFile(@RequestBody Map<String, String> requestBody) {
        String templateFile = requestBody.get("Template File");
        String market = requestBody.get("Market");
        logger.info("Received request: DELETE /deleteFile, market={}, file={}", market, templateFile);
        return ud12UploadDeleteTemplateService.deleteFile(templateFile, market);
    }
}
