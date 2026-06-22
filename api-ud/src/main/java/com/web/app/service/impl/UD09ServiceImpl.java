package com.web.app.service.impl;

import com.web.app.domain.UD09BatchDeleteRequest;
import com.web.app.domain.UD09BatchDeleteResponse;
import com.web.app.domain.UD08SearchRequest;
import com.web.app.domain.entity.HdocUserDefinedRules;
import com.web.app.mapper.UD09Mapper;
import com.web.app.service.UD09Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * UD09业务逻辑实现类
 * 用户自定义规则搜索结果列表与批量删除
 */
@Service
public class UD09ServiceImpl implements UD09Service {

    private static final Logger logger = LoggerFactory.getLogger(UD09ServiceImpl.class);

    @Autowired
    private UD09Mapper ud09Mapper;

    @Override
    public List<HdocUserDefinedRules> UD09Search(UD08SearchRequest request) {
        return ud09Mapper.searchUserDefinedRules(request);
    }

    @Override
    public UD09BatchDeleteResponse UD09DeleteSelected(List<UD09BatchDeleteRequest> requests) {
        int deletedCount = 0;
        int failedCount = 0;

        for (UD09BatchDeleteRequest req : requests) {
            try {
                HdocUserDefinedRules existing = ud09Mapper.selectByPrimaryKey(
                        req.getProductClass(), req.getNumber(), req.getMarket());
                if (existing == null) {
                    failedCount++;
                    continue;
                }
                ud09Mapper.deleteByPrimaryKey(req.getProductClass(), req.getNumber(), req.getMarket());
                deletedCount++;
            } catch (Exception e) {
                logger.error("UD09DeleteSelected - Failed to delete: pc={}, num={}, market={}",
                        req.getProductClass(), req.getNumber(), req.getMarket(), e);
                failedCount++;
            }
        }

        UD09BatchDeleteResponse response = new UD09BatchDeleteResponse();
        response.setDeletedCount(deletedCount);
        response.setFailedCount(failedCount);

        if (failedCount == 0) {
            response.setMessage(deletedCount + " records deleted successfully.");
        } else if (deletedCount > 0) {
            response.setMessage(deletedCount + " records deleted, " + failedCount + " records failed.");
        } else {
            response.setMessage("Failed to delete records. Please try again.");
        }

        logger.info("UD09DeleteSelected completed - deleted: {}, failed: {}", deletedCount, failedCount);
        return response;
    }
}
