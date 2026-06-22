package com.web.app.mapper;

import com.web.app.dto.GenerateDocumentResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface GenerateDocumentMapper {

    GenerateDocumentResponse findGenerateDocumentData(@Param("serie") String serie, @Param("chnr") String chnr);
}
