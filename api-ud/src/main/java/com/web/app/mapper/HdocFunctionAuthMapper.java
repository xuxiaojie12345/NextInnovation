package com.web.app.mapper;

import com.web.app.entity.HdocFunctionAuth;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface HdocFunctionAuthMapper {
    List<HdocFunctionAuth> selectByUserId(@Param("userId") String userId);
    int countByUserId(@Param("userId") String userId);
    int insert(HdocFunctionAuth record);
    int deleteByUserId(@Param("userId") String userId);
    int insertBatch(List<HdocFunctionAuth> list);
}
