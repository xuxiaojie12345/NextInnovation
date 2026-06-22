package com.web.app.service.impl;

import com.web.app.mapper.HdocAdcaChangeMapper;
import com.web.app.service.UD16SelectHdocAdcaChangeService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * UD16_ADChange 服务实现类
 */
@Service
public class UD16SelectHdocAdcaChangeServiceImpl implements UD16SelectHdocAdcaChangeService {

    private static final Logger logger = LogManager.getLogger(UD16SelectHdocAdcaChangeServiceImpl.class);

    @Autowired
    private HdocAdcaChangeMapper hdocAdcaChangeMapper;

    @Override
    public void insert(Map<String, Object> params) {
        String serie = (String) params.get("serie");
        String chnr = (String) params.get("chnr");
        String desc = (String) params.get("desc");
        String user = (String) params.get("user");
        String dateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        // 检查是否已存在
        if (hdocAdcaChangeMapper.countBySerieAndChnr(serie, chnr) > 0) {
            throw new RuntimeException("AFTER DEF CHANGE IS NOT ACTIVATED");
        }

        logger.info("新增AD Change，serie: {}, chnr: {}", serie, chnr);
        hdocAdcaChangeMapper.insert(serie, chnr, "Y", "UD", desc, user, dateTime);
    }

    @Override
    public void delete(Map<String, Object> params) {
        String serie = (String) params.get("serie");
        String chnr = (String) params.get("chnr");

        // 检查是否存在
        if (hdocAdcaChangeMapper.countBySerieAndChnr(serie, chnr) == 0) {
            throw new RuntimeException("删除失败");
        }

        logger.info("删除AD Change，serie: {}, chnr: {}", serie, chnr);
        hdocAdcaChangeMapper.deleteBySerieAndChnr(serie, chnr);
    }
}
