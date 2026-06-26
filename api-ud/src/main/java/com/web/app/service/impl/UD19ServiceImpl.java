package com.web.app.service.impl;

import com.web.app.mapper.UD19Mapper;
import com.web.app.service.UD19Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class UD19ServiceImpl implements UD19Service {

    @Autowired
    private UD19Mapper ud19Mapper;

    @Override
    public List<String> selectAllMarkets() {
        return ud19Mapper.selectAllMarketCodes();
    }

    @Override
    public List<Map<String, Object>> searchHdoc(String userid, String user, String market, String check) {
        List<Map<String, Object>> rawList = ud19Mapper.searchHdoc(userid, user, market, check);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> row : rawList) {
            Map<String, Object> camelRow = new LinkedHashMap<>();
            camelRow.put("userid", row.get("USERID"));
            camelRow.put("username", row.get("USERNAME"));
            camelRow.put("market", row.get("MARKET"));
            result.add(camelRow);
        }
        return result;
    }
}
