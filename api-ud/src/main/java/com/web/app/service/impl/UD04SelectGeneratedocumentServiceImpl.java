package com.web.app.service.impl;

import com.web.app.dto.GeneratedDocumentDto;
import com.web.app.mapper.GeneratedDocumentMapper;
import com.web.app.service.UD04SelectGeneratedocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * UD04 Service实现 - 获取生成文档数据
 */
@Service
public class UD04SelectGeneratedocumentServiceImpl implements UD04SelectGeneratedocumentService {

    @Autowired
    private GeneratedDocumentMapper generatedDocumentMapper;

    @Override
    public GeneratedDocumentDto selectGeneratedDocument(String chassisSeries, String chassisNo) {
        GeneratedDocumentDto document = generatedDocumentMapper.selectGeneratedDocument(chassisSeries, chassisNo);
        if (document != null) {
            document.setReplacingParameters(
                    generatedDocumentMapper.selectReplacingParameters(chassisSeries, chassisNo));
        }
        return document;
    }
}
