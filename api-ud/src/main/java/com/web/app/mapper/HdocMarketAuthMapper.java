package com.web.app.mapper;

import org.springframework.stereotype.Repository;
import com.web.app.entity.HdocMarketAuth;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Repository
public interface HdocMarketAuthMapper {
    List<HdocMarketAuth> selectByUserid(@Param("userid") String userid);
    int updateByUseridAndType(HdocMarketAuth record);
    int deleteByUserid(@Param("userid") String userid);
}
