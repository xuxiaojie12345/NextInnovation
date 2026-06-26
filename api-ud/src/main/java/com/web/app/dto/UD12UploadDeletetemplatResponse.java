package com.web.app.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
// import java.util.List;

/**
 * UD12 上传删除模板响应对象
 *
 * 功能说明：返回模板上传、删除及市场列表查询结果
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "UD12上传删除模板响应对象", description = "包含模板上传、删除及市场列表的操作结果")
public class UD12UploadDeletetemplatResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    @ApiModelProperty(value = "响应码", example = "200")
    private Integer code;

    @ApiModelProperty(value = "响应消息", example = "查询成功")
    private String msg;

    @ApiModelProperty(value = "响应数据")
    private Object data;

    // ==================== 静态工厂方法 ====================

    public static UD12UploadDeletetemplatResponse success(String msg, Object data) {
        UD12UploadDeletetemplatResponse response = new UD12UploadDeletetemplatResponse();
        response.setCode(200);
        response.setMsg(msg);
        response.setData(data);
        return response;
    }

    public static UD12UploadDeletetemplatResponse error(Integer code, String msg) {
        UD12UploadDeletetemplatResponse response = new UD12UploadDeletetemplatResponse();
        response.setCode(code);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    // ==================== 内部数据类 ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "市场数据", description = "市场列表")
    public static class MarketData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "市场代码", example = "JP")
        private String market;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "上传文件数据", description = "文件上传结果")
    public static class UploadFileData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "文件名", example = "template.rtf")
        private String fileName;
        @ApiModelProperty(value = "市场", example = "JP")
        private String market;
        @ApiModelProperty(value = "服务器路径", example = "/hdoc/template/upload/JP/template.rtf")
        private String filePath;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "删除文件数据", description = "文件删除结果")
    public static class DeleteFileData implements Serializable {
        private static final long serialVersionUID = 1L;
        @ApiModelProperty(value = "文件名", example = "template.rtf")
        private String fileName;
        @ApiModelProperty(value = "市场", example = "JP")
        private String market;
    }
}
