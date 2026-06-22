package com.web.app.mapper;

import com.web.app.domain.UD08SearchRequest;
import com.web.app.domain.entity.HdocUserDefinedRules;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD09数据访问层
 * 用户自定义规则搜索结果列表与批量删除
 */
public interface UD09Mapper {

    /**
     * UD09Search - 根据条件动态查询
     */
    List<HdocUserDefinedRules> searchUserDefinedRules(UD08SearchRequest request);

    /**
     * UD09SelectForDelete - 根据主键查询待删除记录
     */
    HdocUserDefinedRules selectByPrimaryKey(@Param("pc") String pc, @Param("num") String num, @Param("market") String market);

    /**
     * UD09DeleteSelected - 根据主键删除记录
     */
    int deleteByPrimaryKey(@Param("pc") String pc, @Param("num") String num, @Param("market") String market);
}
