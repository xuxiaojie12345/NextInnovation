package com.web.app.service.impl;

import com.web.app.mapper.UD21Mapper;
import com.web.app.service.UD21Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class UD21ServiceImpl implements UD21Service {

    @Autowired
    private UD21Mapper ud21Mapper;

    @Override
    public List<Map<String, String>> getMarket() {
        return ud21Mapper.selectMarket();
    }
}
