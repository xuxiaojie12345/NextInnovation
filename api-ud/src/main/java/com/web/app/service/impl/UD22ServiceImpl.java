package com.web.app.service.impl;

import com.web.app.mapper.UD22Mapper;
import com.web.app.service.UD22Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class UD22ServiceImpl implements UD22Service {

    @Autowired
    private UD22Mapper ud22Mapper;

    @Override
    public List<Map<String, String>> getDocumentTypes() {
        return ud22Mapper.selectDocumentTypes();
    }
}
