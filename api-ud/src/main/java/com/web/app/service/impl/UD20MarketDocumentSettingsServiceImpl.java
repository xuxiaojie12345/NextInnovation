package com.web.app.service.impl;

import com.web.app.dto.Ud20UpdateRequest;
import com.web.app.entity.HdocDocumentList;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.UD20MarketDocumentSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UD20MarketDocumentSettingsServiceImpl implements UD20MarketDocumentSettingsService {

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Override
    public void updateHdocDocumentList(Ud20UpdateRequest request) {
        HdocDocumentList record = new HdocDocumentList();
        record.setDoctype(request.getDoctype());
        record.setRegisterUser(request.getRegisterUser());
        record.setRegisterDatetime(request.getRegisterDatetime() != null ? java.time.LocalDateTime.parse(request.getRegisterDatetime()) : null);
        record.setRegisterProcess(request.getRegisterProcess());
        record.setUpdateUser(request.getUpdateUser());
        record.setUpdateDatetime(request.getUpdateDatetime() != null ? java.time.LocalDateTime.parse(request.getUpdateDatetime()) : null);
        record.setUpdateProcess(request.getUpdateProcess());
        int result = hdocDocumentListMapper.updateByDoctype(record);
        if (result <= 0) {
            throw new RuntimeException("情报更新成功");
        }
    }
}
