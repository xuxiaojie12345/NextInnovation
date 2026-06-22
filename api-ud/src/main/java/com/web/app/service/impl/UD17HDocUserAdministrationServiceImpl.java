package com.web.app.service.impl;

import com.web.app.mapper.HdocFunctionAuthMapper;
import com.web.app.mapper.HdocMarketAuthMapper;
import com.web.app.mapper.UserMapper;
import com.web.app.service.UD17HDocUserAdministrationService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * UD17_HDocUserAdministration 服务实现类
 */
@Service
public class UD17HDocUserAdministrationServiceImpl implements UD17HDocUserAdministrationService {

    private static final Logger logger = LogManager.getLogger(UD17HDocUserAdministrationServiceImpl.class);

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private HdocFunctionAuthMapper hdocFunctionAuthMapper;

    @Autowired
    private HdocMarketAuthMapper hdocMarketAuthMapper;

    @Override
    public Map<String, Object> getUserInfo(String userid) {
        logger.info("查询用户信息，userid: {}", userid);

        // 检查用户是否存在
        Map<String, Object> userInfo = userMapper.selectByUserid(userid);
        if (userInfo == null) {
            throw new RuntimeException("We didn't recognize the userid you entered. Please try again.");
        }

        // 查询权限
        List<Map<String, Object>> permissions = hdocMarketAuthMapper.selectPermissionsByUserid(userid);

        // 组装权限列表
        Map<String, List<String>> permissionMap = new LinkedHashMap<>();
        for (Map<String, Object> perm : permissions) {
            String function = (String) perm.get("FUNCTION");
            String market = (String) perm.get("MARKET");
            permissionMap.computeIfAbsent(function, k -> new ArrayList<>()).add(market);
        }

        List<Map<String, Object>> permissionList = new ArrayList<>();
        for (Map.Entry<String, List<String>> entry : permissionMap.entrySet()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("role", entry.getKey());
            item.put("markets", entry.getValue());
            permissionList.add(item);
        }

        // 获取用户名
        String username = (String) userInfo.get("USERNAME");
        if (username == null) username = "";

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("username", username);
        result.put("permissions", permissionList);

        return result;
    }

    @Override
    public void updateRole(Map<String, Object> params) {
        String userid = (String) params.get("userid");

        logger.info("更新用户权限，userid: {}", userid);

        // 检查用户是否存在
        Map<String, Object> userInfo = userMapper.selectByUserid(userid);
        if (userInfo == null) {
            throw new RuntimeException("We didn't recognize the userid you entered. Please try again.");
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> permissions = (List<Map<String, Object>>) params.get("permissions");
        if (permissions != null) {
            for (Map<String, Object> perm : permissions) {
                String role = (String) perm.get("role");
                hdocFunctionAuthMapper.updateFunction(userid, role);

                @SuppressWarnings("unchecked")
                List<String> markets = (List<String>) perm.get("markets");
                if (markets != null) {
                    for (String market : markets) {
                        hdocMarketAuthMapper.updateMarket(userid, market, role);
                    }
                }
            }
        }
    }

    @Override
    public void deleteRole(String userid) {
        logger.info("删除用户权限，userid: {}", userid);

        // 清空功能权限和市场权限
        hdocFunctionAuthMapper.clearFunction(userid);
        hdocMarketAuthMapper.clearMarket(userid);
    }
}
