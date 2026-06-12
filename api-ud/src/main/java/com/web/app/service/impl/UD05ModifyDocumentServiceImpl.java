package com.web.app.service.impl;

import com.web.app.service.UD05ModifyDocumentService;
import com.web.app.dto.*;
import com.web.app.mapper.*;
import com.web.app.entity.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class UD05ModifyDocumentServiceImpl implements UD05ModifyDocumentService {

    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;
    @Autowired
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;

    @Override
    public SelectVariableModificationResponse selectVariableModification(UD05SelectVariableRequest request) {
        if (request == null || request.getChassisNo() == null) {
            SelectVariableModificationResponse res = new SelectVariableModificationResponse();
            res.setCode(400);
            res.setMsg("Invalid request parameters");
            return res;
        }

        // For simplicity, we query modifications by chassis
        List<HdocAdcaModification> modifications = hdocAdcaModificationMapper.selectBySerieAndChno("", request.getChassisNo());
        List<SelectVariableModificationResponse.VariableItem> variables = new ArrayList<>();

        if (modifications != null) {
            for (HdocAdcaModification mod : modifications) {
                SelectVariableModificationResponse.VariableItem item = new SelectVariableModificationResponse.VariableItem();
                item.setVariableName(mod.getVariable());
                item.setCurrentValue(mod.getNewval());
                item.setModifiedValue(mod.getNewval());
                variables.add(item);
            }
        }

        return SelectVariableModificationResponse.success(variables);
    }

    @Override
    public UpdateModificationResponse updateModification(UD05UpdateModificationRequest request) {
        if (request == null || request.getModifications() == null || request.getModifications().isEmpty()) {
            return UpdateModificationResponse.error("NO UNRELEASED VERSION EXISTS!");
        }
        // Process each modification
        for (UD05UpdateModificationRequest.ModificationItem item : request.getModifications()) {
            // Update logic would go here
        }
        return UpdateModificationResponse.success();
    }
}
