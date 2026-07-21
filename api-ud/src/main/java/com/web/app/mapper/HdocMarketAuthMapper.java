package com.web.app.mapper;

import com.web.app.entity.HdocMarketAuth;
import org.apache.ibatis.annotations.Param;
import java.util.List;

public interface HdocMarketAuthMapper {
    List<HdocMarketAuth> selectByUserId(@Param("userId") String userId);
    int deleteByUserId(@Param("userId") String userId);
    int insertBatch(List<HdocMarketAuth> list);
}
