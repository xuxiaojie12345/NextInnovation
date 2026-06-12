package com.web.app.mapper;

import org.springframework.stereotype.Repository;
import com.web.app.entity.HdocFunctionAuth;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Repository
public interface HdocFunctionAuthMapper {
    List<HdocFunctionAuth> selectByUserid(@Param("userid") String userid);
    int updateByUserid(HdocFunctionAuth record);
    int deleteByUserid(@Param("userid") String userid);
}
