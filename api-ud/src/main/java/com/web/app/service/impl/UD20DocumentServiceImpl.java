package com.web.app.service.impl;

import com.web.app.mapper.UD20DocumentMapper;
import com.web.app.service.UD20DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class UD20DocumentServiceImpl implements UD20DocumentService {

    @Autowired
    private UD20DocumentMapper ud20DocumentMapper;

    @Override
    public List<Map<String, Object>> getDocumentList(Map<String, String> params) {
        return ud20DocumentMapper.selectDocumentList(params);
    }

    @Override
    public int updateDocumentList(Map<String, String> params) {
        return ud20DocumentMapper.updateDocumentList(params);
    }
}
