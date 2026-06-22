package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface ModifyDocumentMapper {

    List<Map<String, Object>> selectModifications(@Param("serie") String serie, @Param("chnr") String chnr);

    int updateModificationValue(@Param("serie") String serie, @Param("chno") String chno,
                                 @Param("variable") String variable, @Param("newval") String newval,
                                 @Param("user") String user);
}
