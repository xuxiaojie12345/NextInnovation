package com.web.app.service.impl;

import com.web.app.service.UD20MarketDocumentSettingsService;
import com.web.app.dto.*;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.entity.HdocDocumentList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Date;

@Service
public class UD20MarketDocumentSettingsServiceImpl implements UD20MarketDocumentSettingsService {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    public UD20MarketDocumentSettingsResponse updateHdocDocumentList(UD20MarketDocumentSettingsRequest request) {
        if (request.getDocumentType() == null || request.getDocumentType().isEmpty()) {
            return UD20MarketDocumentSettingsResponse.error("No data found");
        }
        HdocDocumentList doc = hdocDocumentListMapper.selectByDoctype(request.getDocumentType());
        if (doc == null) {
            return UD20MarketDocumentSettingsResponse.error("No data found");
        }
        doc.setUpdateDatetime(new Date());
        doc.setUpdateUser(request.getUser());
        hdocDocumentListMapper.updateByDoctype(doc);

        UD20MarketDocumentSettingsResponse.DataInfo data = new UD20MarketDocumentSettingsResponse.DataInfo();
        data.setDocumentType(request.getDocumentType());
        data.setBusinessUnit(request.getBusinessUnit());
        data.setUser(request.getUser());
        data.setDate(request.getDate());
        return UD20MarketDocumentSettingsResponse.success(data);
    }
}
