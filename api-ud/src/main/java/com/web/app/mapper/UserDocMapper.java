package com.web.app.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserDocMapper {

  int deleteUserDoc(@Param("userid") String userid);

  int insertUserDoc(
      @Param("userid") String userid,
      @Param("doctype") String doctype,
      @Param("currentUser") String currentUser);

  int selectFunctionAuthCount(@Param("userid") String userid);

  List<String> selectUserDoc(@Param("userid") String userid);
}
