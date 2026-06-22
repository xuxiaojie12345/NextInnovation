package com.web.app.service.impl;

import com.web.app.mapper.UserAdminMapper;
import com.web.app.service.UserAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class UserAdminServiceImpl implements UserAdminService {

    @Autowired
    private UserAdminMapper userAdminMapper;

    @Override
    public Map<String, Object> getUserAuthList(String userid) {
        List<Map<String, Object>> authRecords = userAdminMapper.selectUserAuth(userid);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", userid);

        if (authRecords == null || authRecords.isEmpty()) {
            result.put("username", "");
            result.put("authList", new ArrayList<>());
            return result;
        }

        Map<String, Object> first = authRecords.get(0);
        result.put("username", first.get("USERNAME"));

        List<Map<String, String>> authList = new ArrayList<>();
        for (Map<String, Object> record : authRecords) {
            Map<String, String> auth = new LinkedHashMap<>();
            auth.put("function", (String) record.get("FUNCTION"));
            auth.put("market", (String) record.get("MARKET"));
            authList.add(auth);
        }
        result.put("authList", authList);
        return result;
    }

    // 将 FUNCTION 名映射为 market_auth.TYPE 代码
    private String mapFunctionToType(String function) {
        switch (function) {
            case "User Administrator": return "A";
            case "RULES": return "R";
            case "TEMPLATE": return "T";
            case "USER": return "U";
            case "Document": return "D";
            case "ADAPTATION DOC": return "DOCMOD";
            case "market super user": return "MCSU";
            default: return function;
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int updateUserRole(String userid, List<Map<String, String>> authList) {
        // 1. Delete existing function auth
        userAdminMapper.deleteFunctionAuth(userid);
        // 2. Delete existing market auth
        userAdminMapper.deleteMarketAuth(userid);

        int count = 0;
        String currentUser = "SYSTEM";
        // 3. Insert new auth records (deduplicate function auth)
        Set<String> insertedFunctions = new HashSet<>();
        for (Map<String, String> auth : authList) {
            String function = auth.get("function");
            String market = auth.get("market");
            // Only insert function auth once per function
            if (!insertedFunctions.contains(function)) {
                userAdminMapper.insertFunctionAuth(userid, function, currentUser);
                insertedFunctions.add(function);
            }
            // Only insert market auth when market value exists
            if (market != null && !market.trim().isEmpty()) {
                String typeCode = mapFunctionToType(function);
                userAdminMapper.insertMarketAuth(userid, market, typeCode, currentUser);
            }
            count++;
        }
        return count;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteUserRole(String userid) {
        userAdminMapper.deleteFunctionAuth(userid);
        userAdminMapper.deleteMarketAuth(userid);
    }
}
