package com.web.app.mapper;

import org.springframework.stereotype.Repository;
import com.web.app.entity.HdocUserInfor;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Repository
public interface HdocUserInforMapper {
    HdocUserInfor findByUserId(@Param("userId") String userId);
    HdocUserInfor findByUserIdAndPassword(@Param("userId") String userId, @Param("password") String password);
    int countByUserId(@Param("userId") String userId);
}
