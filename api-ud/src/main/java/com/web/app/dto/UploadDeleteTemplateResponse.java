package com.web.app.dto;

import java.util.List;

/**
 * 上传删除模板响应DTO
 */
public class UploadDeleteTemplateResponse {

    private int code;
    private String msg;
    private Data data;

    public UploadDeleteTemplateResponse() {
    }

    public UploadDeleteTemplateResponse(int code, String msg, Data data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public Data getData() {
        return data;
    }

    public void setData(Data data) {
        this.data = data;
    }

    /**
     * 上传成功
     */
    public static UploadDeleteTemplateResponse uploadSuccess(String fileName, String market) {
        UploadDeleteTemplateResponse response = new UploadDeleteTemplateResponse();
        response.setCode(200);
        response.setMsg("上传成功");
        Data data = new Data();
        data.setFileName(fileName);
        data.setMarket(market);
        response.setData(data);
        return response;
    }

    /**
     * 删除成功
     */
    public static UploadDeleteTemplateResponse deleteSuccess(String market, String templateName) {
        UploadDeleteTemplateResponse response = new UploadDeleteTemplateResponse();
        response.setCode(200);
        response.setMsg("删除成功");
        Data data = new Data();
        data.setMarket(market);
        data.setTemplateName(templateName);
        response.setData(data);
        return response;
    }

    /**
     * 获取Market列表成功
     */
    public static UploadDeleteTemplateResponse getMarketsSuccess(List<String> markets) {
        UploadDeleteTemplateResponse response = new UploadDeleteTemplateResponse();
        response.setCode(200);
        response.setMsg("获取成功");
        Data data = new Data();
        data.setMarkets(markets);
        response.setData(data);
        return response;
    }

    /**
     * 获取模板列表成功
     */
    public static UploadDeleteTemplateResponse getTemplatesSuccess(String market, List<String> templates) {
        UploadDeleteTemplateResponse response = new UploadDeleteTemplateResponse();
        response.setCode(200);
        response.setMsg("获取成功");
        Data data = new Data();
        data.setMarket(market);
        data.setTemplates(templates);
        response.setData(data);
        return response;
    }

    /**
     * 失败
     */
    public static UploadDeleteTemplateResponse fail(String msg) {
        UploadDeleteTemplateResponse response = new UploadDeleteTemplateResponse();
        response.setCode(400);
        response.setMsg(msg);
        response.setData(null);
        return response;
    }

    public static class Data {
        private String fileName;
        private String market;
        private String templateName;
        private List<String> markets;
        private List<String> templates;

        public String getFileName() {
            return fileName;
        }

        public void setFileName(String fileName) {
            this.fileName = fileName;
        }

        public String getMarket() {
            return market;
        }

        public void setMarket(String market) {
            this.market = market;
        }

        public String getTemplateName() {
            return templateName;
        }

        public void setTemplateName(String templateName) {
            this.templateName = templateName;
        }

        public List<String> getMarkets() {
            return markets;
        }

        public void setMarkets(List<String> markets) {
            this.markets = markets;
        }

        public List<String> getTemplates() {
            return templates;
        }

        public void setTemplates(List<String> templates) {
            this.templates = templates;
        }
    }
}
