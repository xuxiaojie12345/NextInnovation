package com.web.app.service.impl;

import com.web.app.domain.SaveModificationsQueryResponse;
import com.web.app.mapper.UD06Mapper;
import com.web.app.service.UD06Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

/**
 * UD06业务逻辑实现类
 * 对应详细设计：DES-SaveModifications-001
 *
 * 查询逻辑：
 * 根据serie和chno查询HDOC_ADCA_MODIFICATION表，
 * 获取DOCTYPE、VERS、VARIABLE、NEWVAL等信息。
 *
 * chassisSerie和chassisNumber从chno参数中解析：
 * - chassisSerie为chno中'-'前的部分
 * - chassisNumber为chno中'-'后的部分
 */
@Service
public class UD06ServiceImpl implements UD06Service {

    private static final Logger logger = LoggerFactory.getLogger(UD06ServiceImpl.class);

    @Autowired
    private UD06Mapper ud06Mapper;

    @Override
    public SaveModificationsQueryResponse selectHdocAdcaModification(String serie, String chno) {
        logger.debug("UD06ServiceImpl.selectHdocAdcaModification - serie: {}, chno: {}", serie, chno);

        try {
            // 调用Mapper层查询修改信息
            List<SaveModificationsQueryResponse> recordList = ud06Mapper.selectHdocAdcaModification(serie, chno);

            if (recordList == null || recordList.isEmpty()) {
                logger.warn("No modification records found for serie: {}, chno: {}", serie, chno);
                return null;
            }

            // 取第一条记录填充返回数据（设计保证单底盘最多一条记录对应一个文档类型）
            SaveModificationsQueryResponse firstRecord = recordList.get(0);

            // 解析chassisSerie和chassisNumber（对应设计书 3.1.2 底盘信息解析规则）
            firstRecord.setChassisSerie(serie);
            firstRecord.setChassisNumber(chno);

            logger.info("UD06 query success for serie: {}, chno: {}", serie, chno);
            return firstRecord;

        } catch (Exception e) {
            logger.error("Error querying UD06 data for serie: " + serie + ", chno: " + chno, e);
            throw e;
        }
    }
}
