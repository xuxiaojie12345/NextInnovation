package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface HdocVariablesMapper {

    int insertVariable(@Param("variable") String variable,
                       @Param("type") String type,
                       @Param("description") String description,
                       @Param("currentUser") String currentUser);

    int updateVariable(@Param("variable") String variable,
                       @Param("type") String type,
                       @Param("description") String description,
                       @Param("currentUser") String currentUser);

    int deleteVariable(@Param("variable") String variable);

    int countVariable(@Param("variable") String variable);

    List<Map<String, Object>> searchVariables(@Param("variable") String variable,
                                              @Param("variableOp") String variableOp,
                                              @Param("type") String type,
                                              @Param("typeOp") String typeOp,
                                              @Param("description") String description,
                                              @Param("descriptionOp") String descriptionOp,
                                              @Param("registerUser") String registerUser,
                                              @Param("registerUserOp") String registerUserOp,
                                              @Param("registerDatetime") String registerDatetime,
                                              @Param("registerDatetimeOp") String registerDatetimeOp);
}
