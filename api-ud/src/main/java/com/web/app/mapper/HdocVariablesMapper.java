package com.web.app.mapper;

import com.web.app.entity.HdocVariables;
import com.web.app.dto.HdocVariablesResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface HdocVariablesMapper {
    HdocVariables selectByVariable(@Param("variable") String variable);
    int updateByVariable(HdocVariables record);
    int insertVariable(HdocVariables record);
    int deleteByVariable(@Param("variable") String variable);
    List<HdocVariablesResponse> searchVariables(@Param("variable") String variable, @Param("description") String description);
    int countVariables(@Param("variable") String variable, @Param("description") String description);
}
