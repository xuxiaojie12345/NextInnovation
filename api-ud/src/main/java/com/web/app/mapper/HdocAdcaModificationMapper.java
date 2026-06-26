package com.web.app.mapper;

import com.web.app.dto.ModifyDocumentResponse;
import com.web.app.dto.SaveModificationsResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface HdocAdcaModificationMapper {
    List<ModifyDocumentResponse> selectBySerieAndChno(@Param("serie") String serie, @Param("chno") String chno);
    int updateBySerieAndChno(@Param("serie") String serie, @Param("chno") String chno,
                             @Param("newval") String newval,
                             @Param("description") String description,
                             @Param("updateUser") String updateUser,
                             @Param("updateProcess") String updateProcess);
    List<SaveModificationsResponse> selectSaveModifications(@Param("serie") String serie, @Param("chno") String chno);
}
