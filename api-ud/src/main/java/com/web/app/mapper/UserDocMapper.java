package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserDocMapper {

    int deleteUserDoc(@Param("userid") String userid);

    int insertUserDoc(@Param("userid") String userid,
                      @Param("doctype") String doctype,
                      @Param("currentUser") String currentUser);

    int selectFunctionAuthCount(@Param("userid") String userid);

    List<String> selectUserDoc(@Param("userid") String userid);
}
