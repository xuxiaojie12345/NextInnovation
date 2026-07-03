package com.web.app.service.impl;

import com.web.app.dto.UD07VehicleSpecificationResponse;
import com.web.app.entity.VehicleBasicInfo;
import com.web.app.entity.KolaVariantSymbol;
import com.web.app.entity.KapSnote;
import com.web.app.mapper.HdocRecDataVdaVariantMapper;
import com.web.app.service.UD07VehicleSpecificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD07 - Vehicle Specification查询服务实现类
 */
@Service
public class UD07VehicleSpecificationServiceImpl implements UD07VehicleSpecificationService {

    @Autowired
    private HdocRecDataVdaVariantMapper vdaVariantMapper;

    @Override
    public UD07VehicleSpecificationResponse selectVehicleSpecification(String chassisNo) {
        UD07VehicleSpecificationResponse response = new UD07VehicleSpecificationResponse();

        // 4.4 参数校验
        if (chassisNo == null || chassisNo.trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("底盘编号不能为空");
            return response;
        }

        // 从chassisNo解析serie和chnr（格式: SERIE_CHNR 如 "JPCT_013945"）
        String serie, chnr;
        if (chassisNo.contains("_")) {
            String[] parts = chassisNo.split("_", 2);
            serie = parts[0];
            chnr = parts[1];
        } else {
            serie = chassisNo.length() >= 4 ? chassisNo.substring(0, 4) : chassisNo;
            chnr = chassisNo.length() > 4 ? chassisNo.substring(4) : "";
        }

        // 4.5-1: 查询车辆基本信息（获取FAMILY_ID, VARIANT_ID）
        List<VehicleBasicInfo> basicInfo = null;
        try {
            basicInfo = vdaVariantMapper.selectVehicleBasicInfo(serie, chnr);
        } catch (Exception e) {
            basicInfo = new ArrayList<>();
        }

        // 4.6 判断查询数据是否存在
        if (basicInfo == null || basicInfo.isEmpty()) {
            response.setCode(404);
            response.setMsg("数据不存在");
            return response;
        }

        VehicleBasicInfo firstRow = basicInfo.get(0);
        String familyId = firstRow.getFamilyId() != null ? firstRow.getFamilyId() : "";
        String variantId = firstRow.getVariantId() != null ? firstRow.getVariantId() : "";

        // 4.5-2: 根据FAMILY_ID, VARIANT_ID查询SYMBOL_STR
        List<KolaVariantSymbol> kolaVariants = null;
        try {
            kolaVariants = vdaVariantMapper.selectKolaVariantsByFamily(familyId, variantId);
        } catch (Exception e) {
            kolaVariants = new ArrayList<>();
        }

        // 4.5-KAP: 从HDOC_REC_DATA_OM.CUSTOMER_ADAP查询S-Note数据（返回单个字符串）
        List<KapSnote> sNoteData = null;
        try {
            sNoteData = vdaVariantMapper.selectSNoteBySerieChnr(serie, chnr);
        } catch (Exception e) {
            sNoteData = new ArrayList<>();
        }

        // 4.7 构建响应数据
        Map<String, Object> data = new HashMap<>();
        data.put("chassisNo", chassisNo);
        data.put("model", firstRow.getModel() != null ? firstRow.getModel() : "");
        data.put("builtWeek", firstRow.getBuiltWeek() != null ? firstRow.getBuiltWeek() : "");
        data.put("productType", firstRow.getProductType() != null ? firstRow.getProductType() : "");
        data.put("vin", firstRow.getVin() != null ? firstRow.getVin() : "");
        data.put("engineNo", firstRow.getCustomerAdap() != null ? firstRow.getCustomerAdap() : "");
        data.put("countryOfOperation", firstRow.getCountryOfOperation() != null ? firstRow.getCountryOfOperation() : "");

        // 格式化后的SYMBOL_STR列表
        List<Map<String, String>> symbols = new ArrayList<>();
        if (kolaVariants != null) {
            for (KolaVariantSymbol row : kolaVariants) {
                Map<String, String> item = new HashMap<>();
                item.put("symbol", row.getSymbolStr() != null ? row.getSymbolStr() : "");
                item.put("description", row.getFunctionGroup() != null ? row.getFunctionGroup() : "");
                symbols.add(item);
            }
        }
        data.put("symbols", symbols);

        // S-Notes（遍历所有CUSTOMER_ADAP行）
        List<String> sNotes = new ArrayList<>();
        if (sNoteData != null && !sNoteData.isEmpty()) {
            for (KapSnote item : sNoteData) {
                String raw = item.getSnoteNo();
                if (raw != null && !raw.trim().isEmpty()) {
                    String[] parts = raw.split("\\s+");
                    for (String part : parts) {
                        if (!part.trim().isEmpty()) {
                            sNotes.add(part.trim());
                        }
                    }
                }
            }
        }
        data.put("sNotes", sNotes);

        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }
}
