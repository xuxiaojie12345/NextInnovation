package com.web.app.service.impl;

import com.web.app.dto.UD07VehicleSpecificationRequest;
import com.web.app.dto.UD07VehicleSpecificationResponse;
import com.web.app.entity.UD07KolaVariantVO;
import com.web.app.entity.UD07VehicleSpecificationVO;
import com.web.app.mapper.UD07VehicleSpecificationMapper;
import com.web.app.service.UD07VehicleSpecificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * UD07 车辆规格服务实现类
 *
 * 功能说明：实现车辆规格查询及KOLA变体处理逻辑
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-22
 */
@Slf4j
@Service
public class UD07VehicleSpecificationServiceImpl implements UD07VehicleSpecificationService {

    @Autowired
    private UD07VehicleSpecificationMapper ud07Mapper;

    @Override
    public UD07VehicleSpecificationResponse getHdocRecDataVdaKolaGeneral(UD07VehicleSpecificationRequest request) {

        try {
            String validationError = validateRequest(request);
            if (validationError != null) {
                return UD07VehicleSpecificationResponse.error(400, validationError);
            }

            List<UD07VehicleSpecificationVO> voList = ud07Mapper.selectVehicleSpecification(request.getSerie(),
                    request.getChno());
            if (voList == null || voList.isEmpty()) {
                return UD07VehicleSpecificationResponse.error(404, "Record not found.");
            }
            // 取第一条数据作为主数据
            UD07VehicleSpecificationVO vo = voList.get(0);
            // 收集所有行的CUSTOMER_ADAP，用换行拼接（可能存在多行不同值）
            String combinedCustomerAdap = voList.stream()
                    .map(UD07VehicleSpecificationVO::getCustomerAdap)
                    .filter(adap -> adap != null && !adap.isEmpty())
                    .distinct()
                    .collect(java.util.stream.Collectors.joining("\n"));
            if (combinedCustomerAdap.isEmpty()) {
                combinedCustomerAdap = vo.getCustomerAdap();
            }

            List<UD07KolaVariantVO> variantVOList = ud07Mapper.selectKolaVariants(vo.getFamilyId(), vo.getVariantId());
            List<UD07VehicleSpecificationResponse.KolaVariantData> kolaVariants = new ArrayList<>();

            if (variantVOList != null) {
                for (UD07KolaVariantVO variant : variantVOList) {
                    String symbol = variant.getSymbol() == null ? "" : variant.getSymbol();
                    String functionGroup = variant.getFunctionGroup() == null ? "" : variant.getFunctionGroup();
                    String familyId = variant.getFamilyId() == null ? "" : variant.getFamilyId();

                    String formattedSymbol = symbol.length() >= 8
                            ? symbol.substring(0, 8)
                            : String.format("%-8s", symbol);

                    String paddedFunctionGroup = functionGroup.length() >= 4
                            ? functionGroup.substring(0, 4)
                            : String.format("%-4s", functionGroup);
                    String formattedFunctionGroup = paddedFunctionGroup + familyId;

                    UD07VehicleSpecificationResponse.KolaVariantData variantData = new UD07VehicleSpecificationResponse.KolaVariantData();
                    variantData.setSymbol(formattedSymbol);
                    variantData.setFunctionGroup(formattedFunctionGroup);
                    variantData.setDescription(variant.getDescription());
                    kolaVariants.add(variantData);
                }
            }

            UD07VehicleSpecificationResponse.VehicleSpecificationData data = new UD07VehicleSpecificationResponse.VehicleSpecificationData();
            data.setModel(vo.getModel());
            data.setCustomerAdap(combinedCustomerAdap);
            data.setBuildWeek(vo.getBuildWeek());
            data.setProductType(vo.getProductType());
            data.setVin(vo.getVin());
            data.setCountryOfOperation(vo.getCountryOfOperation());
            data.setFamilyId(vo.getFamilyId());
            data.setVariantId(vo.getVariantId());
            data.setKolaVariants(kolaVariants);

            return UD07VehicleSpecificationResponse.success(data);
        } catch (Exception e) {
            return UD07VehicleSpecificationResponse.error(500, "System error. Please try again later.");
        }
    }

    private String validateRequest(UD07VehicleSpecificationRequest request) {
        if (request == null) {
            return "Request is required.";
        }
        if (!StringUtils.hasText(request.getSerie())) {
            return "Serie is required.";
        }
        if (request.getSerie().length() > 5) {
            return "Serie must be at most 5 characters.";
        }
        if (!request.getSerie().matches("^[a-zA-Z0-9]+$")) {
            return "Serie must contain only alphanumeric characters.";
        }
        if (!StringUtils.hasText(request.getChno())) {
            return "Chno is required.";
        }
        if (request.getChno().length() > 10) {
            return "Chno must be at most 10 characters.";
        }
        if (!request.getChno().matches("^[0-9]+$")) {
            return "Chno must contain only digits.";
        }
        return null;
    }
}
