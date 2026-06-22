package com.web.app.service.impl;

import com.web.app.domain.UD10SearchRequest;
import com.web.app.domain.entity.HdocVariable;
import com.web.app.mapper.UD10Mapper;
import com.web.app.service.UD10Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * UD10业务逻辑实现类
 * HDOC_VARIABLES表的增删改查
 * 对应全体APIのプロンプト.txt 【UD10HdocvariablesApi】
 */
@Service
public class UD10ServiceImpl implements UD10Service {

    private static final Logger logger = LoggerFactory.getLogger(UD10ServiceImpl.class);

    @Autowired
    private UD10Mapper ud10Mapper;

    @Override
    public List<HdocVariable> search(UD10SearchRequest request) {
        return ud10Mapper.searchHdocVariables(request);
    }

    @Override
    public HdocVariable selectByVariable(String variable) {
        return ud10Mapper.selectByVariable(variable);
    }

    @Override
    public String add(String variable, String type, String description, String userid, String registerDatetime) {
        // 检查1：Variable是否已存在
        int count = ud10Mapper.countByVariable(variable);
        if (count > 0) {
            logger.warn("UD10Add - Variant already exists: variable={}", variable);
            return "Variant already exists. Please enter the correct content";
        }

        // 插入HDOC_VARIABLES表
        HdocVariable record = new HdocVariable();
        record.setVariable(variable);
        record.setType(type);
        record.setDescription(description);
        record.setUserid(userid);

        // 处理日期：如果前端传了日期则使用，否则使用当前时间
        if (registerDatetime != null && !registerDatetime.trim().isEmpty()) {
            try {
                record.setRegisterDatetime(LocalDateTime.parse(registerDatetime.replace(" ", "T")));
            } catch (Exception e) {
                record.setRegisterDatetime(LocalDateTime.now());
            }
        } else {
            record.setRegisterDatetime(LocalDateTime.now());
        }

        record.setRegisterUser(userid != null ? userid : "SYSTEM");
        record.setRegisterProcess("UD10Add");
        record.setUpdateDatetime(LocalDateTime.now());
        record.setUpdateUser(userid != null ? userid : "SYSTEM");
        record.setUpdateProcess("UD10Add");

        ud10Mapper.insert(record);
        logger.info("UD10Add - Record inserted successfully: variable={}", variable);
        return null; // null表示成功
    }

    @Override
    public String update(String variable, String type, String description, String userid, String registerDatetime) {
        // 检查：记录是否存在
        HdocVariable existing = ud10Mapper.selectByVariable(variable);
        if (existing == null) {
            logger.warn("UD10Update - Variant does not exists: variable={}", variable);
            return "Variant does not exists. Please enter the correct content";
        }

        // 更新HDOC_VARIABLES表
        HdocVariable record = new HdocVariable();
        record.setVariable(variable);
        record.setType(type);
        record.setDescription(description);
        record.setUserid(userid);

        // 处理日期
        if (registerDatetime != null && !registerDatetime.trim().isEmpty()) {
            try {
                record.setRegisterDatetime(LocalDateTime.parse(registerDatetime.replace(" ", "T")));
            } catch (Exception e) {
                record.setRegisterDatetime(existing.getRegisterDatetime());
            }
        } else {
            record.setRegisterDatetime(existing.getRegisterDatetime());
        }

        record.setRegisterUser(existing.getRegisterUser());
        record.setUpdateDatetime(LocalDateTime.now());
        record.setUpdateUser(userid != null ? userid : "SYSTEM");
        record.setUpdateProcess("UD10Update");

        ud10Mapper.updateByVariable(record);
        logger.info("UD10Update - Record updated successfully: variable={}", variable);
        return null; // null表示成功
    }

    @Override
    public String delete(String variable) {
        // 检查：记录是否存在
        HdocVariable existing = ud10Mapper.selectByVariable(variable);
        if (existing == null) {
            logger.warn("UD10Delete - Variant does not exists: variable={}", variable);
            return "Variant does not exists. Please enter the correct content";
        }

        // 删除记录
        ud10Mapper.deleteByVariable(variable);
        logger.info("UD10Delete - Record deleted successfully: variable={}", variable);
        return null; // null表示成功
    }
}
