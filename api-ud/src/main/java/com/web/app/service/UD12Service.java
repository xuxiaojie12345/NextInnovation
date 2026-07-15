package com.web.app.service;

import com.web.app.domain.UD12FileOperationResponse;
import com.web.app.domain.UD12MarketResponse;
import com.web.app.domain.UD12TemplateFileResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * UD12UploadDeletetemplatApi 服务接口
 * 对应全体APIのプロンプト.txt 【UD12UploadDeletetemplatApi】
 *
 * 功能：模板上传删除管理
 * 含UD12SelectMarket市场及模板列表查询、UD12UploadFlie文件上传、UD12DeleteFlie文件删除
 */
 /**

  * UD12Service

  */

public interface UD12Service {

    /**
     * UD12SelectMarket - 获取市场列表
     * 从MARKET_MASTER表无条件检索所有市场信息
     * @return 市场列表
     */
    List<UD12MarketResponse> selectMarketMaster();

    /**
     * UD12SelectMarket - 获取指定市场下的模板文件列表
     * 根据市场代码读取对应文件夹下的文件列表
     * @param marketCode 市场代码
     * @return 模板文件列表
     */
    List<UD12TemplateFileResponse> selectTemplateFiles(String marketCode);

    /**
     * UD12UploadFlie - 上传模板文件到指定市场文件夹
     * @param file 上传的文件对象
     * @param market 市场代码
     * @return 上传结果（文件名和市场代码）
     */
    UD12FileOperationResponse uploadFile(MultipartFile file, String market);

    /**
     * UD12DeleteFlie - 从指定市场文件夹删除模板文件
     * @param market 市场代码
     * @param fileName 要删除的文件名
     * @return 删除结果（文件名和市场代码）
     */
    UD12FileOperationResponse deleteFile(String market, String fileName);
}
