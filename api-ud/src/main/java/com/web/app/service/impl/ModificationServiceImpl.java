package com.web.app.service.impl;

import com.web.app.dto.response.ModificationDetailResponse;
import com.web.app.dto.response.VariableModificationResponse;
import com.web.app.dto.request.UD05UpdateModificationRequest;
import com.web.app.entity.HdocAdcaModification;
import com.web.app.entity.HdocVariables;
import com.web.app.mapper.HdocAdcaModificationMapper;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.service.ModificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ModificationServiceImpl implements ModificationService {

    @Autowired
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;

    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;

    @Override
    public VariableModificationResponse getVariableModification(String chassisNo) {
        List<HdocAdcaModification> list = hdocAdcaModificationMapper.selectByChassisNo(chassisNo);
        List<VariableModificationResponse.VariableItem> items = list.stream()
            .map(m -> {
                // 变量描述：从 HDOC_VARIABLES 按变量名查询
                String description = "";
                HdocVariables mv = hdocVariablesMapper.selectByVariable(m.getVariable());
                if (mv != null && mv.getDescription() != null) {
                    description = mv.getDescription();
                }
                // 当前值 = 修改表里的 NEWVAL；editable 由 STA==1 决定（允许编辑的行）
                boolean editable = m.getSta() != null && m.getSta().intValue() == 1;
                return new VariableModificationResponse.VariableItem(
                    m.getVariable(), description, m.getNewval(), m.getNewval(), editable);
            })
            .collect(Collectors.toList());
        return new VariableModificationResponse(items);
    }

    @Override
    public void updateModification(UD05UpdateModificationRequest request) {
        // Implementation would convert DTO to entity and call mapper
    }

    @Override
    public ModificationDetailResponse getModificationDetail(String serie, String chassisNo) {
        // serie 为空时退化为仅按 chassisNo 查询（Save Modifications 从 Modify Document 进入，
        // 仅携带 chassisNo，无 serie）
        List<HdocAdcaModification> list = (serie != null && !serie.isEmpty())
                ? hdocAdcaModificationMapper.selectBySerieAndChassisNo(serie, chassisNo)
                : hdocAdcaModificationMapper.selectByChassisNo(chassisNo);
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
        // 存在未发布的修改记录 => foundUnreleasedVersion=true；message 标注版本已发布状态
        resp.setFoundUnreleasedVersion(true);
        resp.setMessage("VERSION IS RELEASED");
        return resp;
    }
}
