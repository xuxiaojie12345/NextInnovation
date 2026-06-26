package com.web.app.service.impl;

import com.web.app.dto.UD15SelecthdocsenddatavinplateRequest;
import com.web.app.dto.UD15SelecthdocsenddatavinplateResponse;
import com.web.app.entity.HdocSendDataVinPlate;
import com.web.app.mapper.UD15SelecthdocsenddatavinplateMapper;
import com.web.app.service.UD15SelecthdocsenddatavinplateService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

import static com.web.app.dto.UD15SelecthdocsenddatavinplateResponse.PrintItemData;
import static com.web.app.dto.UD15SelecthdocsenddatavinplateResponse.VpDataItem;

/**
 * UD15 VIN Plate数据服务实现类
 *
 * 功能说明：实现VIN Plate信息查询、状态更新的业务逻辑
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@Service
public class UD15SelecthdocsenddatavinplateServiceImpl implements UD15SelecthdocsenddatavinplateService {

    @Autowired
    private UD15SelecthdocsenddatavinplateMapper ud15Mapper;

    @Override
    public UD15SelecthdocsenddatavinplateResponse viewInfo(UD15SelecthdocsenddatavinplateRequest request) {
        log.info("开始UD15查询VIN Plate信息, serie: {}, chnr: {}", request.getChassisSerie(), request.getChassisNo());
        try {
            if (request.getChassisSerie() == null || request.getChassisSerie().trim().isEmpty()
                    || request.getChassisNo() == null || request.getChassisNo().trim().isEmpty()) {
                return UD15SelecthdocsenddatavinplateResponse.error(400, "底盘系列和底盘编号不能为空");
            }

            HdocSendDataVinPlate vinPlate = ud15Mapper.selectVinPlateInfo(
                    request.getChassisSerie().trim(), request.getChassisNo().trim());

            if (vinPlate == null) {
                log.warn("UD15查询VIN Plate信息 - 记录不存在, serie: {}, chnr: {}",
                        request.getChassisSerie(), request.getChassisNo());
                return UD15SelecthdocsenddatavinplateResponse.error(404, "记录不存在");
            }

            // 构建响应数据
            UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData data = new UD15SelecthdocsenddatavinplateResponse.VinPlateInfoData();
            data.setChassisNumber(request.getChassisNo().trim());
            data.setPlateType(vinPlate.getType());
            data.setStatus(vinPlate.getStatus());
            data.setErrorMessage(vinPlate.getMsg());
            data.setRegisterDatetime(vinPlate.getRegisterDatetime());
            data.setDocReady(vinPlate.getDocReady());
            data.setDocSent(vinPlate.getDocSent());

            // 从XML_DOC字段解析PrintItemName和VP Data
            // 注意：XML_DOC字段实际存储的是纯文本格式，不是XML
            // 格式示例: "PrintItemName 82644192 product type"
            // 按连续空格分割后，每两个一组作为name-value对
            List<PrintItemData> printItems = new ArrayList<>();
            List<VpDataItem> vpData = new ArrayList<>();

            String xmlDoc = vinPlate.getXmlDoc();
            if (xmlDoc != null && !xmlDoc.trim().isEmpty()) {
                // 按连续空格或换行分割
                String[] tokens = xmlDoc.trim().split("\\s+");

                // 用两个指针遍历：偶数位为name，奇数位为value
                // 前两个token作为PrintItemName的name/value
                if (tokens.length >= 2) {
                    printItems.add(new PrintItemData(tokens[0], tokens[1]));
                }

                // 剩余token每两个一组作为VP Data的variantName/value
                for (int i = 2; i + 1 < tokens.length; i += 2) {
                    vpData.add(new VpDataItem(tokens[i], tokens[i + 1]));
                }
                // 如果剩余奇数个token，最后一个单独作为value（name为空）
                if (tokens.length > 2 && (tokens.length - 2) % 2 == 1) {
                    // 最后一个token追加到最后一个vpData的value中
                    int lastIdx = vpData.size() - 1;
                    if (lastIdx >= 0) {
                        VpDataItem last = vpData.get(lastIdx);
                        vpData.set(lastIdx, new VpDataItem(last.getVariantName(),
                                last.getValue() + " " + tokens[tokens.length - 1]));
                    }
                }
            }

            data.setPrintItems(printItems);
            data.setVpData(vpData);

            log.info("UD15查询VIN Plate信息成功");
            return UD15SelecthdocsenddatavinplateResponse.success("查询成功", data);
        } catch (Exception e) {
            log.error("UD15查询VIN Plate信息失败", e);
            return UD15SelecthdocsenddatavinplateResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD15SelecthdocsenddatavinplateResponse setRegenerate(UD15SelecthdocsenddatavinplateRequest request) {
        log.info("开始UD15设置重新生成, serie: {}, chnr: {}", request.getChassisSerie(), request.getChassisNo());
        try {
            if (request.getChassisSerie() == null || request.getChassisSerie().trim().isEmpty()
                    || request.getChassisNo() == null || request.getChassisNo().trim().isEmpty()) {
                return UD15SelecthdocsenddatavinplateResponse.error(400, "底盘系列和底盘编号不能为空");
            }

            // 检查记录是否存在
            HdocSendDataVinPlate vinPlate = ud15Mapper.selectVinPlateInfo(
                    request.getChassisSerie().trim(), request.getChassisNo().trim());
            if (vinPlate == null) {
                log.warn("UD15设置重新生成 - 记录不存在");
                return UD15SelecthdocsenddatavinplateResponse.error(404, "记录不存在，无法更新");
            }

            Integer result = ud15Mapper.updateStatusRegenerate(
                    request.getChassisSerie().trim(), request.getChassisNo().trim());
            if (result == null || result == 0) {
                return UD15SelecthdocsenddatavinplateResponse.error(500, "更新失败");
            }

            log.info("UD15设置重新生成成功");
            return UD15SelecthdocsenddatavinplateResponse.success("状态已更新为重新生成", null);
        } catch (Exception e) {
            log.error("UD15设置重新生成失败", e);
            return UD15SelecthdocsenddatavinplateResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD15SelecthdocsenddatavinplateResponse setOK(UD15SelecthdocsenddatavinplateRequest request) {
        log.info("开始UD15设置OK, serie: {}, chnr: {}", request.getChassisSerie(), request.getChassisNo());
        try {
            if (request.getChassisSerie() == null || request.getChassisSerie().trim().isEmpty()
                    || request.getChassisNo() == null || request.getChassisNo().trim().isEmpty()) {
                return UD15SelecthdocsenddatavinplateResponse.error(400, "底盘系列和底盘编号不能为空");
            }

            Integer result = ud15Mapper.updateStatusSetOk(
                    request.getChassisSerie().trim(), request.getChassisNo().trim());
            if (result == null || result == 0) {
                return UD15SelecthdocsenddatavinplateResponse.error(500, "更新失败");
            }

            log.info("UD15设置OK成功");
            return UD15SelecthdocsenddatavinplateResponse.success("状态已更新为OK", null);
        } catch (Exception e) {
            log.error("UD15设置OK失败", e);
            return UD15SelecthdocsenddatavinplateResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD15SelecthdocsenddatavinplateResponse changeToBasicInfo(UD15SelecthdocsenddatavinplateRequest request) {
        log.info("开始UD15切换为基础信息, serie: {}, chnr: {}", request.getChassisSerie(), request.getChassisNo());
        try {
            if (request.getChassisSerie() == null || request.getChassisSerie().trim().isEmpty()
                    || request.getChassisNo() == null || request.getChassisNo().trim().isEmpty()) {
                return UD15SelecthdocsenddatavinplateResponse.error(400, "底盘系列和底盘编号不能为空");
            }

            Integer result = ud15Mapper.updateStatusChangeBasic(
                    request.getChassisSerie().trim(), request.getChassisNo().trim());
            if (result == null || result == 0) {
                return UD15SelecthdocsenddatavinplateResponse.error(500, "更新失败");
            }

            log.info("UD15切换为基础信息成功");
            return UD15SelecthdocsenddatavinplateResponse.success("已切换到基本信息", null);
        } catch (Exception e) {
            log.error("UD15切换为基础信息失败", e);
            return UD15SelecthdocsenddatavinplateResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD15SelecthdocsenddatavinplateResponse changeToAdvancedInfo(UD15SelecthdocsenddatavinplateRequest request) {
        log.info("开始UD15切换为高级信息, serie: {}, chnr: {}", request.getChassisSerie(), request.getChassisNo());
        try {
            if (request.getChassisSerie() == null || request.getChassisSerie().trim().isEmpty()
                    || request.getChassisNo() == null || request.getChassisNo().trim().isEmpty()) {
                return UD15SelecthdocsenddatavinplateResponse.error(400, "底盘系列和底盘编号不能为空");
            }

            Integer result = ud15Mapper.updateStatusChangeAdvanced(
                    request.getChassisSerie().trim(), request.getChassisNo().trim());
            if (result == null || result == 0) {
                return UD15SelecthdocsenddatavinplateResponse.error(500, "更新失败");
            }

            log.info("UD15切换为高级信息成功");
            return UD15SelecthdocsenddatavinplateResponse.success("已切换到高级信息", null);
        } catch (Exception e) {
            log.error("UD15切换为高级信息失败", e);
            return UD15SelecthdocsenddatavinplateResponse.error(500, "系统繁忙，请稍后重试");
        }
    }
}
