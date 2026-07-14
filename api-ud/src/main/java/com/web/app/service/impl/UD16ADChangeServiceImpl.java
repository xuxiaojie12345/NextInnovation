package com.web.app.service.impl;

import com.web.app.dto.UD16ADChangeRequest;
import com.web.app.dto.UD16ADChangeResponse;
import com.web.app.entity.HdocAdcaChange;
import com.web.app.mapper.UD16ADChangeMapper;
import com.web.app.service.UD16ADChangeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UD16 AD/CA变更服务实现类
 *
 * 功能说明：实现AD/CA变更记录的添加、删除、检查的业务逻辑
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@Service
public class UD16ADChangeServiceImpl implements UD16ADChangeService {

    @Autowired
    private UD16ADChangeMapper ud16Mapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD16ADChangeResponse addChange(UD16ADChangeRequest request) {
        log.info("开始UD16添加AD/CA变更, serie: {}, chnr: {}, desc: {}",
                request.getSerie(), request.getChnr(), request.getDesc());
        try {
            if (request.getSerie() == null || request.getSerie().trim().isEmpty()
                    || request.getChnr() == null || request.getChnr().trim().isEmpty()) {
                return UD16ADChangeResponse.error(400, "系列和底盘号不能为空");
            }

            // 检查记录是否存在
            HdocAdcaChange existing = ud16Mapper.selectAdcaChange(
                    request.getSerie().trim(), request.getChnr().trim());

            if (existing != null) {
                // 记录已存在时，无论ACT状态如何，都返回409，前端弹框后结束处理
                log.warn("UD16添加AD/CA变更 - 记录已存在, serie: {}, chnr: {}",
                        request.getSerie(), request.getChnr());
                return UD16ADChangeResponse.error(409, "AFTER DEF CHANGE IS NOT ACTIVATED");
            } else {
                // 不存在则插入新记录
                String loginUser = (request.getUserId() != null && !request.getUserId().trim().isEmpty())
                        ? request.getUserId().trim()
                        : "SYSTEM";
                HdocAdcaChange adcaChange = new HdocAdcaChange();
                adcaChange.setSerie(request.getSerie().trim());
                adcaChange.setChnr(request.getChnr().trim());
                adcaChange.setAct("Y");
                adcaChange.setBu("UD");
                adcaChange.setReason(request.getDesc());
                adcaChange.setRegisterUser(loginUser);
                adcaChange.setRegisterProcess("UD16");
                adcaChange.setUpdateUser(loginUser);
                adcaChange.setUpdateProcess("UD16");
                Integer result = ud16Mapper.insertAdcaChange(adcaChange);
                if (result == null || result == 0) {
                    return UD16ADChangeResponse.error(500, "插入失败");
                }
            }

            return UD16ADChangeResponse.success("添加成功", null);
        } catch (Exception e) {
            log.error("UD16添加AD/CA变更失败", e);
            return UD16ADChangeResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD16ADChangeResponse deleteChange(UD16ADChangeRequest request) {
        log.info("开始UD16删除AD/CA变更, serie: {}, chnr: {}", request.getSerie(), request.getChnr());
        try {
            if (request.getSerie() == null || request.getSerie().trim().isEmpty()
                    || request.getChnr() == null || request.getChnr().trim().isEmpty()) {
                return UD16ADChangeResponse.error(400, "系列和底盘号不能为空");
            }

            // 检查记录是否存在
            HdocAdcaChange existing = ud16Mapper.selectAdcaChange(
                    request.getSerie().trim(), request.getChnr().trim());
            if (existing == null) {
                log.warn("UD16删除AD/CA变更 - 记录不存在");
                return UD16ADChangeResponse.error(404, "记录不存在");
            }

            // 物理删除记录
            Integer result = ud16Mapper.deleteAdcaChange(
                    request.getSerie().trim(), request.getChnr().trim());
            if (result == null || result == 0) {
                return UD16ADChangeResponse.error(500, "删除失败");
            }

            return UD16ADChangeResponse.success("删除成功", null);
        } catch (Exception e) {
            log.error("UD16删除AD/CA变更失败", e);
            return UD16ADChangeResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    public UD16ADChangeResponse checkChange(UD16ADChangeRequest request) {
        log.info("开始UD16检查AD/CA变更, serie: {}, chnr: {}", request.getSerie(), request.getChnr());
        try {
            if (request.getSerie() == null || request.getSerie().trim().isEmpty()
                    || request.getChnr() == null || request.getChnr().trim().isEmpty()) {
                return UD16ADChangeResponse.error(400, "系列和底盘号不能为空");
            }

            // 查询记录是否存在
            HdocAdcaChange existing = ud16Mapper.selectAdcaChange(
                    request.getSerie().trim(), request.getChnr().trim());

            if (existing == null) {
                log.warn("UD16检查AD/CA变更 - 记录不存在");
                return UD16ADChangeResponse.error(404, "记录不存在");
            }

            // 返回exists和act字段，前端需要根据data.exists做判断
            java.util.Map<String, Object> resultData = new java.util.HashMap<>();
            resultData.put("exists", true);
            resultData.put("act", existing.getAct());
            return UD16ADChangeResponse.success("对应的数据存在", resultData);
        } catch (Exception e) {
            log.error("UD16检查AD/CA变更失败", e);
            return UD16ADChangeResponse.error(500, "系统繁忙，请稍后重试");
        }
    }
}
