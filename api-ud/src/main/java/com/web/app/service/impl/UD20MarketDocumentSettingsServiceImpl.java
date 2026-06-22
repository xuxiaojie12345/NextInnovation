package com.web.app.service.impl;

import com.web.app.dto.*;
import com.web.app.entity.HdocDocumentList;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.UD20MarketDocumentSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD20 - 文档列表查询和Market Document Settings服务实现类
 */
@Service
public class UD20MarketDocumentSettingsServiceImpl implements UD20MarketDocumentSettingsService {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    public UD20GetDocumentListResponse selectHdocDocumentList(UD20GetDocumentListRequest request) {
        UD20GetDocumentListResponse response = new UD20GetDocumentListResponse();

        List<HdocDocumentList> documents;
        if (request.getDocumentType() != null && !request.getDocumentType().trim().isEmpty()) {
            documents = hdocDocumentListMapper.selectByDocumentType(request.getDocumentType());
        } else {
            documents = hdocDocumentListMapper.selectAllDocumentTypes();
        }

        Map<String, Object> data = new HashMap<>();
        data.put("documents", documents);

        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }

    @Override
    public UD20MarketDocumentSettingsResponse updateHdocDocumentList(UD20MarketDocumentSettingsRequest request) {
        UD20MarketDocumentSettingsResponse response = new UD20MarketDocumentSettingsResponse();

        if (request.getDocumentType() == null || request.getDocumentType().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("文档类型不能为空");
            return response;
        }

        // 检查文档是否存在
        List<HdocDocumentList> list = hdocDocumentListMapper.selectByDocumentType(request.getDocumentType());
        if (list == null || list.isEmpty()) {
            response.setCode(404);
            response.setMsg("No data found");
            return response;
        }

        // 更新
        HdocDocumentList document = new HdocDocumentList();
        document.setDoctype(request.getDocumentType());
        document.setRegisterUser(request.getUser());
        document.setRegisterDatetime(request.getDate());

        hdocDocumentListMapper.updateDocument(document);

        Map<String, Object> data = new HashMap<>();
        data.put("documentType", request.getDocumentType());
        data.put("businessUnit", request.getBusinessUnit());
        data.put("user", request.getUser());
        data.put("date", request.getDate());

        response.setCode(200);
        response.setMsg("更新成功");
        response.setData(data);
        return response;
    }
}
