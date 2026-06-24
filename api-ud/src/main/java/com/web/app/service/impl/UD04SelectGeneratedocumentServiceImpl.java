package com.web.app.service.impl;

import com.web.app.dto.SelectGenerateDocumentResponse;
import com.web.app.mapper.HdocRecDataOmMapper;
import com.web.app.service.UD04SelectGeneratedocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UD04SelectGeneratedocumentServiceImpl implements UD04SelectGeneratedocumentService {

    @Autowired
    private HdocRecDataOmMapper hdocRecDataOmMapper;

    @Override
    public SelectGenerateDocumentResponse selectHdocRecDataOm(String serie, String chnr) {
        if (serie == null || chnr == null) {
            throw new IllegalArgumentException("系列编号和频道编号不能为空");
        }
        SelectGenerateDocumentResponse response = hdocRecDataOmMapper.selectHdocRecDataOm(serie, chnr);
        if (response == null) {
            throw new RuntimeException("查询失败，没有找到对应的文档数据");
        }
        return response;
    }
}
