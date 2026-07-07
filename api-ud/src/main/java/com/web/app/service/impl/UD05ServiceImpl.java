package com.web.app.service.impl;

import com.web.app.domain.ModifyDocumentQueryResponse;
import com.web.app.domain.ModifyDocumentQueryResponse.VariableInfo;
import com.web.app.mapper.UD05Mapper;
import com.web.app.service.UD05Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

/**
 * UD05业务逻辑实现类
 * 对应详细设计：DES-ModifyDocument-001
 *
 * 查询逻辑：
 * 根据serie和chno关联查询
 * HDOC_ADCA_MODIFICATION（左连接）HDOC_VARIABLES，获取变量信息。
 * 若HDOC_ADCA_MODIFICATION中不存在对应变量，
 * 则Current value和Modified value均为空。
 *
 * 更新逻辑：
 * 更新HDOC_ADCA_MODIFICATION表的NEWVAL字段。
 */
@Service
public class UD05ServiceImpl implements UD05Service {

    private static final Logger logger = LoggerFactory.getLogger(UD05ServiceImpl.class);

    @Autowired
    private UD05Mapper ud05Mapper;

    @Override
    public ModifyDocumentQueryResponse selectVariableModification(String serie, String chno) {
        logger.debug("UD05ServiceImpl.selectVariableModification - serie: {}, chno: {}", serie, chno);

        try {
            // 调用Mapper层查询变量列表
            List<VariableInfo> variableList = ud05Mapper.selectVariableModification(serie, chno);

            // 构建响应对象
            ModifyDocumentQueryResponse response = new ModifyDocumentQueryResponse();
            response.setChassisNo(chno);
            response.setVariables(variableList);

            // 模板文件当前使用固定值
            response.setTemplateFile("aus/UD_TEST.odt");

            logger.info("UD05 query success for chno: {}, found {} variables", chno, variableList.size());
            return response;

        } catch (Exception e) {
            logger.error("Error querying UD05 data for serie: " + serie + ", chno: " + chno, e);
            throw e;
        }
    }

    @Override
    public boolean updateHdocAdcaModification(String serie, String chno, String variable, String modifiedValue, String updateUser) {
        logger.debug("UD05ServiceImpl.updateHdocAdcaModification - serie: {}, chno: {}, variable: {}, modifiedValue: {}, updateUser: {}",
                serie, chno, variable, modifiedValue, updateUser);

        try {
            int rows = ud05Mapper.updateHdocAdcaModification(serie, chno, variable, modifiedValue, updateUser);

            if (rows > 0) {
                logger.info("UD05 update success for serie: {}, chno: {}, variable: {}", serie, chno, variable);
                return true;
            } else {
                logger.warn("UD05 update - no record found for serie: {}, chno: {}, variable: {}", serie, chno, variable);
                return false;
            }
        } catch (Exception e) {
            logger.error("Error updating UD05 data for serie: " + serie + ", chno: " + chno + ", variable: " + variable, e);
            throw e;
        }
    }
}
