package com.web.app.service.impl;

import com.web.app.dto.UD06SaveModificationsRequest;
import com.web.app.dto.UD06SaveModificationsResponse;
import com.web.app.entity.UD06SaveModificationsVO;
import com.web.app.mapper.UD06SaveModificationsMapper;
import com.web.app.service.UD06SaveModificationsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * UD06 保存修改内容服务实现类
 *
 * 功能说明：实现UD06保存修改内容查询业务逻辑
 * 支持按变量名列表过滤，以精确匹配每条修改记录
 *
 * @author Qoder Assistant
 * @version 1.0
 * @date 2026-06-22
 */
@Slf4j
@Service
public class UD06SaveModificationsServiceImpl implements UD06SaveModificationsService {

    @Autowired
    private UD06SaveModificationsMapper ud06Mapper;

    @Override
    public UD06SaveModificationsResponse UD06SelectHdocAdcaModification(UD06SaveModificationsRequest request) {

        try {
            String validationError = validateRequest(request);
            if (validationError != null) {
                return UD06SaveModificationsResponse.error(400, validationError);
            }

            // 查询时传入变量名列表，精确匹配被修改的记录
            List<UD06SaveModificationsVO> voList = ud06Mapper.selectHdocAdcaModification(
                    request.getChassisSerie(),
                    request.getChassisNo(),
                    request.getVariables());

            if (voList == null || voList.isEmpty()) {
                return UD06SaveModificationsResponse.error(404, "Record not found.");
            }

            // 返回第一条记录（所有修改项属于同一文档，Doctype/Version一致）
            UD06SaveModificationsVO vo = voList.get(0);
            UD06SaveModificationsResponse.DataObject data = new UD06SaveModificationsResponse.DataObject();
            data.setDoctype(vo.getDoctype());
            data.setVers(vo.getVers());
            data.setVariable(vo.getVariable());
            data.setNewVal(vo.getNewVal());

            return UD06SaveModificationsResponse.success(data);
        } catch (Exception e) {
            return UD06SaveModificationsResponse.error(500, "System error. Please try again later.");
        }
    }

    private String validateRequest(UD06SaveModificationsRequest request) {
        if (request == null) {
            return "Request is required.";
        }
        if (!StringUtils.hasText(request.getChassisSerie())) {
            return "Chassis serie is required.";
        }
        if (request.getChassisSerie().length() > 5) {
            return "Chassis serie must be at most 5 characters.";
        }
        if (!request.getChassisSerie().matches("^[a-zA-Z0-9]+$")) {
            return "Chassis serie must contain only alphanumeric characters.";
        }
        if (!StringUtils.hasText(request.getChassisNo())) {
            return "Chassis no is required.";
        }
        if (request.getChassisNo().length() > 10) {
            return "Chassis no must be at most 10 characters.";
        }
        if (!request.getChassisNo().matches("^[0-9]+$")) {
            return "Chassis no must contain only digits.";
        }
        return null;
    }
}
