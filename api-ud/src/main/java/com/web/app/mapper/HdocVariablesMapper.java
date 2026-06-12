package com.web.app.mapper;

import org.springframework.stereotype.Repository;
import com.web.app.entity.HdocVariables;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Repository
public interface HdocVariablesMapper {
    int countByVariable(@Param("variable") String variable);
    List<HdocVariables> selectByCondition(@Param("variable") String variable, @Param("type") String type, @Param("description") String description);
    int insert(HdocVariables record);
    int updateByVariable(HdocVariables record);
    int deleteByVariable(@Param("variable") String variable);
}
