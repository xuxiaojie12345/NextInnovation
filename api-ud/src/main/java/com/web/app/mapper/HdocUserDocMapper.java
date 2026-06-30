package com.web.app.mapper;

import com.web.app.entity.HdocUserDoc;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface HdocUserDocMapper {
    List<HdocUserDoc> selectByUserId(@Param("userId") String userId);
    int deleteByUserId(@Param("userId") String userId);
    int insertUserDoc(HdocUserDoc record);
}
