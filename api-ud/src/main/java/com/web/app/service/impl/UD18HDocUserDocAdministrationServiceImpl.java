package com.web.app.service.impl;

import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.mapper.HdocUserDocMapper;
import com.web.app.mapper.UserMapper;
import com.web.app.service.UD18HDocUserDocAdministrationService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * UD18_HDocUserDocAdministration 服务实现类
 */
@Service
public class UD18HDocUserDocAdministrationServiceImpl implements UD18HDocUserDocAdministrationService {

    private static final Logger logger = LogManager.getLogger(UD18HDocUserDocAdministrationServiceImpl.class);

    @Autowired
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Autowired
    private HdocUserDocMapper hdocUserDocMapper;

    @Autowired
    private UserMapper userMapper;

    @Override
    public List<Map<String, Object>> getDocumentList() {
        logger.info("查询所有文档列表");
        return hdocDocumentListMapper.selectAllDoctypeDescriptions();
    }

    @Override
    public List<Map<String, Object>> selectUserDoc(String userid) {
        logger.info("查询用户文档权限，userid: {}", userid);

        // 检查用户是否存在
        Map<String, Object> userInfo = userMapper.selectByUserid(userid);
        if (userInfo == null) {
            throw new RuntimeException("We didn't recognize the userid you entered. Please try again.");
        }

        return hdocUserDocMapper.selectByUserid(userid);
    }

    @Override
    public void updateUserDoc(Map<String, Object> params) {
        String userid = (String) params.get("userid");
        String currentUser = (String) params.get("user");
        String dateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        logger.info("更新用户文档权限，userid: {}", userid);

        // 检查用户是否存在
        Map<String, Object> userInfo = userMapper.selectByUserid(userid);
        if (userInfo == null) {
            throw new RuntimeException("We didn't recognize the userid you entered. Please try again.");
        }

        // 先删除旧权限
        hdocUserDocMapper.deleteByUserid(userid);

        // 再插入新权限
        @SuppressWarnings("unchecked")
        List<String> documents = (List<String>) params.get("documents");
        if (documents != null) {
            for (String doctype : documents) {
                hdocUserDocMapper.insert(userid, doctype, currentUser, dateTime);
            }
        }
    }
}
