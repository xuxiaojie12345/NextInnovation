package com.web.app.mapper;

import com.web.app.entity.HdocDocumentList;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DocumentListMapper {

  List<HdocDocumentList> findAllDocumentTypes();
}
