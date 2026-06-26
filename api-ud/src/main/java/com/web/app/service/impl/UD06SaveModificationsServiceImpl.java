package com.web.app.service.impl;

import com.web.app.dto.SaveModificationsResponse;
import com.web.app.mapper.HdocAdcaModificationMapper;
import com.web.app.service.UD06SaveModificationsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UD06SaveModificationsServiceImpl implements UD06SaveModificationsService {

    @Autowired
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;

    @Override
    public List<SaveModificationsResponse> selectHdocAdcaModification(String serie, String chno) {
        if (serie == null || chno == null) {
            throw new IllegalArgumentException("SERIE和CHNO不能为空");
        }
        List<SaveModificationsResponse> list = hdocAdcaModificationMapper.selectSaveModifications(serie, chno);
        if (list == null || list.isEmpty()) {
            throw new RuntimeException("查询失败，没有找到对应的数据");
        }
        return list;
    }
}
