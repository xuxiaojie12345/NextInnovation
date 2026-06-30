package com.web.app.mapper;

import com.web.app.dto.UserInfoResponse;
import com.web.app.dto.SearchResultResponse;
import com.web.app.entity.HdocMarketAuth;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;

@Mapper
public interface HdocMarketAuthMapper {
    List<UserInfoResponse> selectUserAuthByUserId(@Param("userId") String userId);
    int insertMarketAuth(HdocMarketAuth record);
    int deleteMarketAuthByUserId(@Param("userId") String userId);
    int deleteFunctionAuthByUserId(@Param("userId") String userId);
    List<SearchResultResponse> searchUserList(Map<String, Object> params);
}
