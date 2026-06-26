package com.web.app.service.impl;

import com.web.app.dto.UD201UpdateHdocDocumentRequest;
import com.web.app.dto.UD201UpdateHdocDocumentResponse;
import com.web.app.mapper.UD201UpdateHdocDocumentMapper;
import com.web.app.service.UD201UpdateHdocDocumentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UD20-1 更新文档列表服务实现类
 *
 * 功能说明：实现文档更新操作的业务逻辑
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@Service
public class UD201UpdateHdocDocumentServiceImpl implements UD201UpdateHdocDocumentService {

    @Autowired
    private UD201UpdateHdocDocumentMapper ud201Mapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD201UpdateHdocDocumentResponse updateDocumentList(UD201UpdateHdocDocumentRequest request) {
        log.info("开始UD20-1更新文档列表, doctype: {}", request.getDoctype());
        try {
            if (request.getDoctype() == null || request.getDoctype().trim().isEmpty()) {
                return UD201UpdateHdocDocumentResponse.error(400, "文档类型不能为空");
            }

            Integer result = ud201Mapper.updateDocumentList(
                    request.getDoctype().trim(),
                    request.getRegisterUser(),
                    request.getRegisterDatetime());

            if (result == null || result == 0) {
                log.warn("UD20-1更新文档列表失败 - 文档类型不存在, doctype: {}", request.getDoctype());
                return UD201UpdateHdocDocumentResponse.error(404, "文档类型不存在");
            }

            log.info("UD20-1更新文档列表成功");
            return UD201UpdateHdocDocumentResponse.success("保存成功", null);
        } catch (Exception e) {
            log.error("UD20-1更新文档列表失败", e);
            return UD201UpdateHdocDocumentResponse.error(500, "系统繁忙，请稍后重试");
        }
    }
}
