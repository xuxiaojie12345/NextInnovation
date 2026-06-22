package com.web.app.mapper;

import com.web.app.entity.HdocDocumentList;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface DocumentListMapper {

    List<HdocDocumentList> findAllDocumentTypes();
}
