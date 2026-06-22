package com.web.app.service.impl;

import com.web.app.domain.SelectVariableModificationResponse;
import com.web.app.domain.VariableModificationItem;
import com.web.app.dto.UD05UpdateModificationRequest;
import com.web.app.mapper.HdocAdcaModificationMapper;
import com.web.app.service.UD05ModifyDocumentService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * UD05_ModifyDocument 服务实现类
 */
@Service
public class UD05ModifyDocumentServiceImpl implements UD05ModifyDocumentService {

    private static final Logger logger = LogManager.getLogger(UD05ModifyDocumentServiceImpl.class);

    @Autowired
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;

    /**
     * 查询变量修改信息
     * 执行提示词中的 SQL：LEFT JOIN HDOC_VARIABLES 和 HDOC_ADCA_MODIFICATION
     *
     * @param serie 系列编号
     * @param chassisNo 底盘号
     * @return 变量修改列表
     */
    @Override
    public SelectVariableModificationResponse selectVariableModification(String serie, String chassisNo) {
        logger.info("开始查询变量修改信息，serie: {}, chassisNo: {}", serie, chassisNo);

        // 执行提示词中的 JOIN SQL 查询
        List<VariableModificationItem> items = hdocAdcaModificationMapper.selectBySerieAndChno(serie, chassisNo);

        // modifiedValue 设为 null（提示词中与 currentValue 共用 NEWVAL 字段）
        for (VariableModificationItem item : items) {
            item.setModifiedValue(null);
        }

        // 封装响应
        SelectVariableModificationResponse response = new SelectVariableModificationResponse();
        response.setVariables(items);

        logger.info("变量修改信息查询成功，共{}个变量", items.size());
        return response;
    }

    /**
     * 更新修改变量值
     * 批量更新HDOC_ADCA_MODIFICATION表中的NEWVAL字段
     *
     * @param request 更新请求
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateModification(UD05UpdateModificationRequest request) {
        String serie = request.getSerie();
        String chassisNo = request.getChassisNo();
        List<UD05UpdateModificationRequest.ModificationItem> modifications = request.getModifications();

        logger.info("开始更新变量修改值，serie: {}, chassisNo: {}, 修改数量: {}",
                serie, chassisNo, modifications != null ? modifications.size() : 0);

        // 校验modifications列表是否为空
        if (modifications == null || modifications.isEmpty()) {
            logger.warn("修改列表为空");
            throw new IllegalArgumentException("NO UNRELEASED VERSION EXISTS!");
        }

        // 校验是否至少包含一个有效的新值
        boolean hasValidValue = modifications.stream()
                .anyMatch(item -> item.getNewValue() != null && !item.getNewValue().trim().isEmpty());
        if (!hasValidValue) {
            logger.warn("所有修改值均为空");
            throw new IllegalArgumentException("NO UNRELEASED VERSION EXISTS!");
        }

        // 批量更新
        int updateCount = 0;
        String updateUser = request.getUpdateUser() != null ? request.getUpdateUser() : "SYSTEM";
        for (UD05UpdateModificationRequest.ModificationItem item : modifications) {
            if (item.getNewValue() == null || item.getNewValue().trim().isEmpty()) {
                continue; // 跳过空值
            }

            try {
                int rows = hdocAdcaModificationMapper.updateNewVal(
                        serie, chassisNo, item.getVariableName(), item.getNewValue().trim(), updateUser);
                if (rows > 0) {
                    updateCount++;
                    logger.debug("变量 {} 更新成功", item.getVariableName());
                } else {
                    // 记录不存在，可尝试插入新记录
                    logger.warn("变量 {} 的修改记录不存在，无法更新", item.getVariableName());
                }
            } catch (Exception e) {
                logger.error("变量 {} 更新失败: {}", item.getVariableName(), e.getMessage());
                throw new RuntimeException("Failed to update variable: " + item.getVariableName(), e);
            }
        }

        logger.info("变量修改值更新完成，成功更新{}条记录", updateCount);
    }
}
