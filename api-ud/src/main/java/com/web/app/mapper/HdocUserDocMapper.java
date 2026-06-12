package com.web.app.mapper;

import org.springframework.stereotype.Repository;
import com.web.app.entity.HdocUserDoc;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Repository
public interface HdocUserDocMapper {
    List<HdocUserDoc> selectByUserid(@Param("userid") String userid);
    int deleteByUserid(@Param("userid") String userid);
    int insert(HdocUserDoc record);
}
