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
                // 对应设计书 3.2 校验详细规格表 No.4
                // 记录已存在时检查ACT字段
                if ("U".equals(existing.getAct())) {
                    // force=true时跳过检查，直接更新ACT='Y'
                    if (Boolean.TRUE.equals(request.getForce())) {
                        Integer result = ud16Mapper.updateAdcaChangeActY(
                                request.getSerie().trim(), request.getChnr().trim());
                        if (result == null || result == 0) {
                            return UD16ADChangeResponse.error(500, "更新失败");
                        }
                        log.info("UD16添加AD/CA变更成功（force激活已存在记录）");
                        return UD16ADChangeResponse.success("添加成功", null);
                    }
                    // ACT='U'（未激活）-> 返回409，前端弹框确认后重试
                    log.warn("UD16添加AD/CA变更 - 记录存在但ACT未激活(U)");
                    return UD16ADChangeResponse.error(409, "AFTER DEF CHANGE IS NOT ACTIVATED");
                }
                // ACT='Y'（已激活）-> 直接返回成功
                log.info("UD16添加AD/CA变更 - 记录已存在且已激活(Y)");
                return UD16ADChangeResponse.success("添加成功", null);
            } else {
                // 不存在则插入新记录
                HdocAdcaChange adcaChange = new HdocAdcaChange();
                adcaChange.setSerie(request.getSerie().trim());
                adcaChange.setChnr(request.getChnr().trim());
                adcaChange.setAct("Y");
                adcaChange.setBu("UD");
                adcaChange.setReason(request.getDesc());
                Integer result = ud16Mapper.insertAdcaChange(adcaChange);
                if (result == null || result == 0) {
                    return UD16ADChangeResponse.error(500, "插入失败");
                }
                log.info("UD16添加AD/CA变更成功（新建记录）");
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

            // 更新 ACT = 'U'
            Integer result = ud16Mapper.updateAdcaChangeActU(
                    request.getSerie().trim(), request.getChnr().trim());
            if (result == null || result == 0) {
                return UD16ADChangeResponse.error(500, "删除失败");
            }

            log.info("UD16删除AD/CA变更成功");
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

            log.info("UD16检查AD/CA变更成功 - 记录存在");
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
