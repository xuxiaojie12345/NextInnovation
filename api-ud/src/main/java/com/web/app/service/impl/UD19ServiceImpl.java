package com.web.app.service.impl;

import com.web.app.domain.UD19Request;
import com.web.app.mapper.UD19Mapper;
import com.web.app.service.UD19Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
/**

 * UD19ServiceImpl

 */

public class UD19ServiceImpl implements UD19Service {

    @Autowired
    /** ud19Mapper */

    private UD19Mapper ud19Mapper;

    @Override
    /**

     * searchUser

     */

    public Map<String, Object> searchUser(UD19Request request) {
        switch (request.getOperation()) {
            case "GET_MARKET_LIST":
                return handleGetMarketList();
            case "SEARCH_USER":
                return handleSearchUser(request);
            default:
                throw new IllegalArgumentException("Unknown operation: " + request.getOperation());
        }
    }

    /**

     * handleGetMarketList

     */

    private Map<String, Object> handleGetMarketList() {
        List<Map<String, String>> markets = ud19Mapper.selectAllMarkets();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("markets", markets);
        result.put("count", markets.size());
        return result;
    }

    /**

     * handleSearchUser

     */

    private Map<String, Object> handleSearchUser(UD19Request request) {
        List<Map<String, Object>> results;
        String userId = request.getUserid();
        String user = request.getUser();
        String market = request.getMarket();
        String type = request.getType();

        // 在Java层判断type值，传入布尔标记，避免OGNL字符串比较问题
        boolean isRule = "Rule".equals(type);
        boolean isTemplate = "Template".equals(type);

        results = ud19Mapper.searchUsers(userId, user, market, isRule, isTemplate);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("results", results != null ? results : new ArrayList<>());
        result.put("count", results != null ? results.size() : 0);
        return result;
    }
}
