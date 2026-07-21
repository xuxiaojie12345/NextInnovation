package com.web.app.mapper;

import com.web.app.entity.HdocVariables;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface HdocVariablesMapper {
    List<HdocVariables> selectAll();
    List<HdocVariables> selectByCondition(@Param("variable") String variable, @Param("type") String type,
        @Param("description") String description, @Param("createdByUser") String createdByUser,
        @Param("dateFrom") String dateFrom, @Param("dateTo") String dateTo);
    int insert(HdocVariables record);
    int update(HdocVariables record);
    int deleteByVariable(@Param("variable") String variable);
}
