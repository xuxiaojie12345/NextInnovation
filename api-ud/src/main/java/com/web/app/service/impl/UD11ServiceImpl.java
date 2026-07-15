package com.web.app.service.impl;

import com.web.app.domain.UD10SearchRequest;
import com.web.app.domain.entity.HdocVariable;
import com.web.app.mapper.UD11Mapper;
import com.web.app.service.UD11Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * UD11业务逻辑实现类
 * HDOC变量列表检索
 * 对应全体APIのプロンプト.txt 【UD11HdocvariablesApi】
 */
@Service
/**

 * UD11ServiceImpl

 */

public class UD11ServiceImpl implements UD11Service {

    @Autowired
    /** ud11Mapper */

    private UD11Mapper ud11Mapper;

    @Override
    /**

     * search

     */

    public List<HdocVariable> search(UD10SearchRequest request) {
        return ud11Mapper.searchHdocVariables(request);
    }
}
