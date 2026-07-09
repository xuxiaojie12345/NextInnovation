package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocSendDataVinPlate;
import com.web.app.mapper.UD15Mapper;
import com.web.app.service.UD15Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * UD15 Service Implementation
 * 实现VIN Plate信息的查看、重新生成、设置OK、切换类型业务逻辑
 */
@Service
public class UD15ServiceImpl implements UD15Service {

    @Autowired
    private UD15Mapper ud15Mapper;

    @Override
    public ApiResponse<?> viewInfo(HdocSendDataVinPlate request) {

        try {
            // 参数校验
            String chnr = request.getChnr();
            if (chnr == null || chnr.trim().isEmpty()) {
                return ApiResponse.error(400, "Chassis number不能为空");
            }
            chnr = chnr.trim();

            // 查询VIN Plate信息
            String serie = request.getSerie() != null ? request.getSerie() : "";
            HdocSendDataVinPlate record = ud15Mapper.selectByChnr(serie, chnr);

            // 判断记录是否存在
            if (record == null) {
                return ApiResponse.error(400, "Chassis number " + chnr + " not found.");
            }

            // 构建响应数据（chassisNumber = serie + "-" + chnr）
            String fullChassisNumber = (serie != null && !serie.isEmpty()) ? serie + "-" + chnr : chnr;
            Map<String, Object> data = new HashMap<>();
            data.put("chassisNumber", fullChassisNumber);
            data.put("type", record.getType() != null ? record.getType() : "");
            data.put("status", record.getStatus() != null ? record.getStatus() : "");
            data.put("msg", record.getMsg() != null ? record.getMsg() : "");
            data.put("registerDatetime", record.getRegisterDatetime() != null ? record.getRegisterDatetime() : "");
            data.put("docReady", record.getDocReady() != null ? record.getDocReady() : "");
            data.put("docSent", record.getDocSent() != null ? record.getDocSent() : "");
            data.put("xmlDoc", record.getXmlDoc() != null ? record.getXmlDoc() : "");

            return ApiResponse.success("查看VIN Plate信息成功", data);

        } catch (Exception e) {

            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    @Override
    public ApiResponse<?> setRegenerate(HdocSendDataVinPlate request) {

        return updateStatus(request, "0", "UD15_REGENERATE");
    }

    @Override
    public ApiResponse<?> setOk(HdocSendDataVinPlate request) {

        return updateStatus(request, "1", "UD15_SET_OK");
    }

    @Override
    public ApiResponse<?> changeToBasicInfo(HdocSendDataVinPlate request) {

        return updateStatusAndType(request, "0", "1", "UD15_CHANGE_BASIC");
    }

    @Override
    public ApiResponse<?> changeToAdvancedInfo(HdocSendDataVinPlate request) {

        return updateStatusAndType(request, "0", "2", "UD15_CHANGE_ADVANCED");
    }

    /**
     * 通用更新Status方法
     */
    private ApiResponse<?> updateStatus(HdocSendDataVinPlate request, String status, String process) {
        try {
            String chnr = request.getChnr();
            if (chnr == null || chnr.trim().isEmpty()) {
                return ApiResponse.error(400, "Chassis number不能为空");
            }
            chnr = chnr.trim();

            String serie = request.getSerie() != null ? request.getSerie() : "";
            int count = ud15Mapper.countByChnr(serie, chnr);
            if (count == 0) {
                return ApiResponse.error(400, "记录不存在");
            }

            String currentUser = request.getUpdateUser();
            if (currentUser == null || currentUser.trim().isEmpty()) {
                currentUser = "SYSTEM";
            }

            int result = ud15Mapper.updateStatus(serie, chnr, status, currentUser, process);
            if (result > 0) {

                Map<String, Object> data = new HashMap<>();
                data.put("serie", "");
                data.put("chnr", chnr);

                String msg;
                switch (status) {
                    case "0":
                        msg = "设置重新生成成功";
                        break;
                    case "1":
                        msg = "设置OK成功";
                        break;
                    default:
                        msg = "更新成功";
                }
                return ApiResponse.success(msg, data);
            } else {
                return ApiResponse.error(500, "更新失败，请重试");
            }

        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    /**
     * 通用更新Status和Type方法
     */
    private ApiResponse<?> updateStatusAndType(HdocSendDataVinPlate request, String status, String type, String process) {
        try {
            String chnr = request.getChnr();
            if (chnr == null || chnr.trim().isEmpty()) {
                return ApiResponse.error(400, "Chassis number不能为空");
            }
            chnr = chnr.trim();

            String serie = request.getSerie() != null ? request.getSerie() : "";
            int count = ud15Mapper.countByChnr(serie, chnr);
            if (count == 0) {
                return ApiResponse.error(400, "记录不存在");
            }

            String currentUser = request.getUpdateUser();
            if (currentUser == null || currentUser.trim().isEmpty()) {
                currentUser = "SYSTEM";
            }

            int result = ud15Mapper.updateStatusAndType(serie, chnr, status, type, currentUser, process);
            if (result > 0) {


                Map<String, Object> data = new HashMap<>();
                data.put("serie", "");
                data.put("chnr", chnr);

                String msg;
                if ("1".equals(type)) {
                    msg = "切换到基础信息成功";
                } else {
                    msg = "切换到高级信息成功";
                }
                return ApiResponse.success(msg, data);
            } else {
                return ApiResponse.error(500, "更新失败，请重试");
            }

        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }
}
