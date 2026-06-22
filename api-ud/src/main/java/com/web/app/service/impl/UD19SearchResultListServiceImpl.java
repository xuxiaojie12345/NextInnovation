package com.web.app.service.impl;

import com.web.app.mapper.UserMapper;
import com.web.app.service.UD19SearchResultListService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * UD19_SearchResultList 服务实现类
 */
@Service
public class UD19SearchResultListServiceImpl implements UD19SearchResultListService {

    private static final Logger logger = LogManager.getLogger(UD19SearchResultListServiceImpl.class);

    @Autowired
    private UserMapper userMapper;

    @Override
    public List<Map<String, Object>> search(Map<String, Object> params) {
        logger.info("搜索用户信息");
        return userMapper.searchUsers(params);
    }
}
