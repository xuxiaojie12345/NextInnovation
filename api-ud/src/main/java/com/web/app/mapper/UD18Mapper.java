package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
/**

 * UD18Mapper

 */

public interface UD18Mapper {

    List<String> selectFunctionAuth(@Param("userId") String userId);

    String selectUsername(@Param("userId") String userId);

    List<String> selectUserDoc(@Param("userId") String userId);

    int deleteUserDoc(@Param("userId") String userId);

    int insertUserDoc(@Param("userId") String userId, @Param("doctype") String doctype);
}
