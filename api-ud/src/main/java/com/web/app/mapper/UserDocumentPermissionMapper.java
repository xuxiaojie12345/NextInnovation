package com.web.app.mapper;

import com.web.app.entity.HdocUserDoc;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;

/**
 * 用户文档权限Mapper接口
 */
@Mapper
public interface UserDocumentPermissionMapper {
    
    /**
     * 查询用户文档权限
     */
    List<Map<String, Object>> selectUserDocPermissions(@Param("userid") String userid);
    
    /**
     * 删除用户文档权限
     */
    int deleteUserDoc(@Param("userid") String userid);
    
    /**
     * 插入用户文档权限
     */
    int insertUserDoc(HdocUserDoc userDoc);
}
