package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface UD22Mapper {
    List<Map<String, String>> selectDocumentTypes();
}
