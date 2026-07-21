package com.web.app.service.impl;

import com.web.app.dto.response.VehicleSpecificationResponse;
import com.web.app.mapper.*;
import com.web.app.service.GenerateDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class GenerateDocumentServiceImpl implements GenerateDocumentService {

    @Autowired
    private HdocRecDataOmMapper hdocRecDataOmMapper;
    @Autowired
    private HdocRecDataVdaGeneralMapper hdocRecDataVdaGeneralMapper;
    @Autowired
    private HdocRecDataVdaVariantsMapper hdocRecDataVdaVariantsMapper;
    @Autowired
    private HdocRecDataKapSnoteMapper hdocRecDataKapSnoteMapper;
    @Autowired
    private HdocRecDataKolaTireMasterMapper hdocRecDataKolaTireMasterMapper;
    @Autowired
    private HdocRecDataKolaVariantMapper hdocRecDataKolaVariantMapper;

    @Override
    public Map<String, Object> generateDocument(String chassisNo, String docType) {
        Map<String, Object> result = new HashMap<>();
        result.put("chassisNo", chassisNo);
        result.put("docType", docType);
        result.put("omData", hdocRecDataOmMapper.selectByChassisNo(chassisNo));
        result.put("vdaGeneral", hdocRecDataVdaGeneralMapper.selectByChassisNo(chassisNo));
        result.put("vdaVariants", hdocRecDataVdaVariantsMapper.selectByChassisNo(chassisNo));
        result.put("sNote", hdocRecDataKapSnoteMapper.selectByChassisNo(chassisNo));
        result.put("tireMaster", hdocRecDataKolaTireMasterMapper.selectByChassisNo(chassisNo));
        return result;
    }

    @Override
    public VehicleSpecificationResponse getVehicleSpecification(String chassisNo) {
        // Aggregate data from multiple tables into a single response
        VehicleSpecificationResponse resp = new VehicleSpecificationResponse();
        resp.setChassisNo(chassisNo);
        // For now, return what we can query
        return resp;
    }
}
