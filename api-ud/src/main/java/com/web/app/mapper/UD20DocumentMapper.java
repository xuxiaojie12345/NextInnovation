package com.web.app.mapper;

import java.util.List;
import java.util.Map;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UD20DocumentMapper {

  List<Map<String, Object>> selectDocumentList(Map<String, String> params);

  int updateDocumentList(Map<String, String> params);
}
