package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface UD20Mapper {
    List<Map<String, Object>> selectHdocDocumentList(@Param("documentType") String documentType);
}
