package com.web.app.service.impl;

import com.web.app.mapper.UD20Mapper;
import com.web.app.service.UD20Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class UD20ServiceImpl implements UD20Service {

    @Autowired
    private UD20Mapper ud20Mapper;

    @Override
    public List<Map<String, Object>> getDocumentList(String documentType) {
        return ud20Mapper.selectHdocDocumentList(documentType);
    }
}
