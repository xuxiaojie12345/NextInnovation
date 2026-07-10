package com.web.app.service.impl;

import com.web.app.dto.GenerateDocumentRequest;
import com.web.app.dto.GenerateDocumentResponse;
import com.web.app.mapper.GenerateDocumentMapper;
import com.web.app.service.GenerateDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class GenerateDocumentServiceImpl implements GenerateDocumentService {

  @Autowired
  private GenerateDocumentMapper generateDocumentMapper;

  @Override
  public GenerateDocumentResponse getGeneratedocument(GenerateDocumentRequest request) {
    // 参数校验
    if (request.getSerie() == null
        || request.getSerie().trim().isEmpty()
        || request.getChnr() == null
        || request.getChnr().trim().isEmpty()) {
      throw new IllegalArgumentException("Invalid chassis information.");
    }

    GenerateDocumentResponse data =
        generateDocumentMapper.findGenerateDocumentData(
            request.getSerie().trim(), request.getChnr().trim());

    if (data == null) {
      return null;
    }

    // modifyDocLink 已在 setAct() 中由 MyBatis 自动转换
    if (data.getModifyDocLink() == null) {
      data.setModifyDocLink(false);
    }

    // replacingParameters 由 resultMap 的 association 自动映射
    if (data.getReplacingParameters() == null) {
      GenerateDocumentResponse.ReplacingParam param = new GenerateDocumentResponse.ReplacingParam();
      param.setVariable("");
      data.setReplacingParameters(param);
    }

    return data;
  }
}
