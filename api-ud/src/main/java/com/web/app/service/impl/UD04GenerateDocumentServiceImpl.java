package com.web.app.service.impl;

import com.web.app.service.UD04GenerateDocumentService;
import com.web.app.dto.UD04GenerateDocumentRequest;
import com.web.app.dto.UD04GenerateDocumentResponse;
import com.web.app.mapper.*;
import com.web.app.entity.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class UD04GenerateDocumentServiceImpl implements UD04GenerateDocumentService {

    @Autowired
    private HdocRecDataOmMapper hdocRecDataOmMapper;
    @Autowired
    private HdocRecDataVdaGeneralMapper hdocRecDataVdaGeneralMapper;
    @Autowired
    private HdocRecDataKolaTireMasterMapper hdocRecDataKolaTireMasterMapper;
    @Autowired
    private HdocAdcaChangeMapper hdocAdcaChangeMapper;
    @Autowired
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;

    @Override
    public UD04GenerateDocumentResponse getGeneratedDocumentInfo(UD04GenerateDocumentRequest request) {
        if (request == null || request.getChassisNo() == null || request.getChassisSeries() == null) {
            return UD04GenerateDocumentResponse.error("Invalid request parameters");
        }

        String serie = request.getChassisSeries();
        String chnr = request.getChassisNo();

        // Query OM data
        HdocRecDataOm om = hdocRecDataOmMapper.selectBySerieAndChnr(serie, chnr);
        if (om == null) {
            return UD04GenerateDocumentResponse.error("No order data found for chassis: " + serie + "/" + chnr);
        }

        // Query VDA General
        HdocRecDataVdaGeneral general = hdocRecDataVdaGeneralMapper.selectBySerieAndChnr(serie, chnr);

        // Query ADCA Change
        HdocAdcaChange change = hdocAdcaChangeMapper.selectBySerieAndChnr(serie, chnr);

        // Query modifications
        List<HdocAdcaModification> modifications = hdocAdcaModificationMapper.selectBySerieAndChno(serie, chnr);

        // Build response
        UD04GenerateDocumentResponse.DataInfo data = new UD04GenerateDocumentResponse.DataInfo();
        data.setOrderNumber(om.getOrdernumber());
        data.setBuildWeek(om.getBuild() != null ? String.valueOf(om.getBuild()) : "");
        data.setSpecWeek(om.getSpec() != null ? String.valueOf(om.getSpec()) : "");
        data.setMarket(general != null ? general.getCountryOfOperation() : "");
        data.setAdChangeActive(change != null && "Y".equals(change.getAct()));
        data.setDate(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
        data.setVersion("4.2.1");

        // Replacement parameters
        List<UD04GenerateDocumentResponse.ReplacementParam> params = new ArrayList<>();
        if (modifications != null) {
            for (HdocAdcaModification mod : modifications) {
                UD04GenerateDocumentResponse.ReplacementParam param = new UD04GenerateDocumentResponse.ReplacementParam();
                param.setVariable(mod.getVariable());
                param.setNewVal(mod.getNewval());
                params.add(param);
            }
        }
        data.setReplacementParams(params);

        return UD04GenerateDocumentResponse.success(data);
    }
}
