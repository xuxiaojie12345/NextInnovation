package com.web.app.service.impl;

import com.web.app.dto.ModifyDocumentResponse;
import com.web.app.dto.SaveModificationsResponse;
import com.web.app.mapper.HdocAdcaModificationMapper;
import com.web.app.service.UD05ModifyDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UD05ModifyDocumentServiceImpl implements UD05ModifyDocumentService {

    @Autowired
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;

    @Override
    public List<ModifyDocumentResponse> selectHdocAdcaModification(String serie, String chno) {
        if (serie == null || chno == null) {
            throw new IllegalArgumentException("SERIE和CHNO不能为空");
        }
        List<ModifyDocumentResponse> list = hdocAdcaModificationMapper.selectBySerieAndChno(serie, chno);
        if (list == null || list.isEmpty()) {
            throw new RuntimeException("查询失败，没有找到对应的Modification数据");
        }
        return list;
    }

    @Override
    public void updateHdocAdcaModification(String serie, String chno, String newval, String description, String updateUser, String updateProcess) {
        if (serie == null || chno == null) {
            throw new IllegalArgumentException("SERIE和CHNO不能为空");
        }
        int result = hdocAdcaModificationMapper.updateBySerieAndChno(serie, chno, newval, description, updateUser, updateProcess);
        if (result <= 0) {
            throw new RuntimeException("情报更新失败");
        }
    }
}
