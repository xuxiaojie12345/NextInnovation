package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.UD20Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * UD20 Service Implementation
 * 实现获取文档类型列表的业务逻辑
 */
@Service
public class UD20ServiceImpl implements UD20Service {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    public ApiResponse<?> getDocumentList() {

        try {
            List<Map<String, Object>> documentList = hdocDocumentListMapper.selectDocumentTypeList();

            if (documentList == null || documentList.isEmpty()) {
                return ApiResponse.error(404, "文档列表为空");
            }



            return ApiResponse.success("获取文档列表成功", documentList);

        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public ApiResponse<?> searchDocumentList(String documentType, String operator) {

        try {
            List<Map<String, Object>> documentList = hdocDocumentListMapper.searchDocumentTypeList(documentType, operator);

            if (documentList == null || documentList.isEmpty()) {
                return ApiResponse.error(404, "No data found");
            }

            return ApiResponse.success("获取文档列表成功", documentList);

        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }
}