package com.web.app.service.impl;

import com.web.app.domain.UD08AddRequest;
import com.web.app.domain.UD08DeleteRequest;
import com.web.app.domain.UD08SearchRequest;
import com.web.app.domain.UD08UpdateRequest;
import com.web.app.domain.UD09BatchDeleteRequest;
import com.web.app.domain.UD09BatchDeleteResponse;
import com.web.app.domain.entity.HdocUserDefinedRules;
import com.web.app.domain.entity.HdocVariable;
import com.web.app.domain.entity.MarketMaster;
import com.web.app.domain.entity.ProductClassMaster;
import com.web.app.mapper.UD08Mapper;
import com.web.app.service.UD08Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * UD08业务逻辑实现类
 * 认证变量管理（Homologation Variables）
 */
@Service
public class UD08ServiceImpl implements UD08Service {

    private static final Logger logger = LoggerFactory.getLogger(UD08ServiceImpl.class);

    @Autowired
    private UD08Mapper ud08Mapper;

    @Override
    public List<ProductClassMaster> selectProductClassMaster() {
        return ud08Mapper.selectAllProductClassMaster();
    }

    @Override
    public List<MarketMaster> selectMarketMaster() {
        return ud08Mapper.selectAllMarketMaster();
    }

    @Override
    public List<HdocVariable> selectHdocVariables() {
        return ud08Mapper.selectAllHdocVariables();
    }

    @Override
    public String UD08Add(UD08AddRequest request) {
        String pc = request.getProductClass();
        String num = request.getNumber();
        String market = request.getMarket();
        String variable = request.getVariable();

        // 检查1：主键是否已存在（Product class、Number、Market组合）
        int count = ud08Mapper.countByPrimaryKey(pc, num, market);
        if (count > 0) {
            logger.warn("UD08Add - Primary key conflict: pc={}, num={}, market={}", pc, num, market);
            return "Primary key conflict, Please enter the correct content";
        }

        // 检查2：Variable以"TEMPLATE-"开头时，剩余部分必须在HDOC_VARIABLES中存在
        if (variable != null && variable.startsWith("TEMPLATE-")) {
            String suffix = variable.substring(9);
            if (suffix != null && !suffix.isEmpty()) {
                int varCount = ud08Mapper.countByVariable(suffix);
                if (varCount == 0) {
                    logger.warn("UD08Add - Variant does not exist: {}", suffix);
                    return "Variant does not exist, Please enter the correct content";
                }
            }
        }

        // 插入HDOC_USER_DEFINED_RULES表
        HdocUserDefinedRules record = buildRecord(pc, num, market, request);
        record.setRegisterDatetime(LocalDateTime.now());
        record.setRegisterUser(request.getUpdateUser() != null ? request.getUpdateUser().trim() : null);
        record.setRegisterProcess("UD08Add");
        record.setUpdateDatetime(LocalDateTime.now());
        record.setUpdateUser(request.getUpdateUser() != null ? request.getUpdateUser().trim() : null);
        record.setUpdateProcess("UD08Add");

        ud08Mapper.insert(record);
        logger.info("UD08Add - Record inserted successfully: pc={}, num={}, market={}", pc, num, market);
        return null; // null表示成功
    }

    @Override
    public String UD08Update(UD08UpdateRequest request) {
        String pc = request.getProductClass();
        String num = request.getNumber();
        String market = request.getMarket();
        String variable = request.getVariable();

        // 检查1：记录是否存在
        HdocUserDefinedRules existing = ud08Mapper.selectByPrimaryKey(pc, num, market);
        if (existing == null) {
            logger.warn("UD08Update - Data does not exist: pc={}, num={}, market={}", pc, num, market);
            return "Data does not exist, Please enter the correct content";
        }

        // 检查2：至少有一个更新字段有入力
        if (variable == null && request.getValue() == null && request.getVs() == null
                && request.getVs2() == null && request.getComments() == null
                && request.getAddDate() == null && request.getDeleteDate() == null
                && request.getUpdateUser() == null && request.getUpdateDatetime() == null) {
            logger.warn("UD08Update - No fields to update: pc={}, num={}, market={}", pc, num, market);
            return "No fields to update, Please enter the correct content";
        }

        // 检查3：Variable以"TEMPLATE-"开头时，剩余部分必须在HDOC_VARIABLES中存在
        if (variable != null && variable.startsWith("TEMPLATE-")) {
            String suffix = variable.substring(9);
            if (suffix != null && !suffix.isEmpty()) {
                int varCount = ud08Mapper.countByVariable(suffix);
                if (varCount == 0) {
                    logger.warn("UD08Update - Variant does not exist: {}", suffix);
                    return "Variant does not exist, Please enter the correct content";
                }
            }
        }

        // 更新HDOC_USER_DEFINED_RULES表
        HdocUserDefinedRules record = buildRecord(pc, num, market, request);
        // 使用前端传入的updateDatetime，若为空则使用系统时间
        String reqDatetime = request.getUpdateDatetime();
        if (reqDatetime != null && !reqDatetime.trim().isEmpty()) {
            try {
                String datetimeStr = reqDatetime.trim();
                // 前端格式为"yyyy-MM-dd"（10字符）时补全时间部分
                if (datetimeStr.length() == 10) {
                    datetimeStr = datetimeStr + " 00:00:00";
                }
                record.setUpdateDatetime(LocalDateTime.parse(datetimeStr,
                    java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            } catch (Exception e) {
                logger.warn("UD08Update - Invalid updateDatetime format: {}, use system time", reqDatetime);
                record.setUpdateDatetime(LocalDateTime.now());
            }
        } else {
            record.setUpdateDatetime(LocalDateTime.now());
        }
        String updateUser = request.getUpdateUser() != null ? request.getUpdateUser().trim() : null;
        record.setUpdateUser(updateUser);
        record.setUpdateProcess("UD08Update");

        ud08Mapper.updateByPrimaryKey(record);
        logger.info("UD08Update - Record updated successfully: pc={}, num={}, market={}", pc, num, market);
        return null; // null表示成功
    }

    @Override
    public String UD08Delete(UD08DeleteRequest request) {
        String pc = request.getProductClass();
        String num = request.getNumber();
        String market = request.getMarket();

        // 检查：记录是否存在
        HdocUserDefinedRules existing = ud08Mapper.selectByPrimaryKey(pc, num, market);
        if (existing == null) {
            logger.warn("UD08Delete - Data does not exist: pc={}, num={}, market={}", pc, num, market);
            return "Data does not exist, Please enter the correct content";
        }

        // 删除记录
        ud08Mapper.deleteByPrimaryKey(pc, num, market);
        logger.info("UD08Delete - Record deleted successfully: pc={}, num={}, market={}", pc, num, market);
        return null; // null表示成功
    }

    /**
     * 构建HDOC_USER_DEFINED_RULES实体对象
     */
    private HdocUserDefinedRules buildRecord(String pc, String num, String market, Object request) {
        HdocUserDefinedRules record = new HdocUserDefinedRules();
        record.setPc(pc);
        record.setNum(new BigDecimal(num));
        record.setMarket(market);

        if (request instanceof UD08AddRequest) {
            UD08AddRequest req = (UD08AddRequest) request;
            record.setVariable(req.getVariable());
            record.setVal(req.getValue());
            record.setVs(req.getVs());
            record.setVs2(req.getVs2());
            record.setComments(req.getComments());
            record.setAddDate(req.getAddDate());
            record.setDeleteDate(req.getDeleteDate());
        } else if (request instanceof UD08UpdateRequest) {
            UD08UpdateRequest req = (UD08UpdateRequest) request;
            record.setVariable(req.getVariable());
            record.setVal(req.getValue());
            record.setVs(req.getVs());
            record.setVs2(req.getVs2());
            record.setComments(req.getComments());
            record.setAddDate(req.getAddDate());
            record.setDeleteDate(req.getDeleteDate());
        }

        return record;
    }

    @Override
    public List<HdocUserDefinedRules> UD08Search(UD08SearchRequest request) {
        return ud08Mapper.searchUserDefinedRules(request);
    }

    @Override
    public UD09BatchDeleteResponse batchDelete(List<UD09BatchDeleteRequest> requests) {
        int deletedCount = 0;
        int failedCount = 0;

        for (UD09BatchDeleteRequest req : requests) {
            try {
                // 检查记录是否存在
                HdocUserDefinedRules existing = ud08Mapper.selectByPrimaryKey(
                        req.getProductClass(), req.getNumber(), req.getMarket());
                if (existing == null) {
                    failedCount++;
                    logger.warn("UD09BatchDelete - Record not found: pc={}, num={}, market={}",
                            req.getProductClass(), req.getNumber(), req.getMarket());
                    continue;
                }
                // 执行删除
                ud08Mapper.batchDeleteByPrimaryKey(req.getProductClass(), req.getNumber(), req.getMarket());
                deletedCount++;
            } catch (Exception e) {
                failedCount++;
                logger.error("UD09BatchDelete - Error deleting record: pc={}, num={}, market={}",
                        req.getProductClass(), req.getNumber(), req.getMarket(), e);
            }
        }

        String message;
        if (failedCount == 0) {
            message = deletedCount + " records deleted successfully.";
        } else if (deletedCount > 0) {
            message = deletedCount + " records deleted, " + failedCount + " records failed.";
        } else {
            message = "Failed to delete records. Please try again.";
        }

        return new UD09BatchDeleteResponse(deletedCount, failedCount, message);
    }
}
