package com.web.app.service.impl;

import com.web.app.dto.response.ModificationDetailResponse;
import com.web.app.dto.response.VariableModificationResponse;
import com.web.app.dto.request.UD05UpdateModificationRequest;
import com.web.app.entity.HdocAdcaModification;
import com.web.app.mapper.HdocAdcaModificationMapper;
import com.web.app.service.ModificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ModificationServiceImpl implements ModificationService {

    @Autowired
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;

    @Override
    public VariableModificationResponse getVariableModification(String chassisNo) {
        List<HdocAdcaModification> list = hdocAdcaModificationMapper.selectByChassisNo(chassisNo);
        List<VariableModificationResponse.VariableItem> items = list.stream()
            .map(m -> new VariableModificationResponse.VariableItem(
                m.getVariable(), "", "", m.getNewval(), true))
            .collect(Collectors.toList());
        return new VariableModificationResponse(items);
    }

    @Override
    public void updateModification(UD05UpdateModificationRequest request) {
        // Implementation would convert DTO to entity and call mapper
    }

    @Override
    public ModificationDetailResponse getModificationDetail(String serie, String chassisNo) {
        List<HdocAdcaModification> list = hdocAdcaModificationMapper.selectBySerieAndChassisNo(serie, chassisNo);
        if (list.isEmpty()) {
            return null;
        }
        HdocAdcaModification first = list.get(0);
        List<ModificationDetailResponse.ModificationItem> items = list.stream()
            .map(m -> new ModificationDetailResponse.ModificationItem(m.getVariable(), m.getNewval()))
            .collect(Collectors.toList());
        ModificationDetailResponse resp = new ModificationDetailResponse();
        resp.setSerie(serie);
        resp.setChassisNo(chassisNo);
        resp.setDoctype(first.getDoctype());
        resp.setVersion(first.getVers() != null ? first.getVers().intValue() : null);
        resp.setModifications(items);
        return resp;
    }
}
